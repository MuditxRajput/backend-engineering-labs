# Notification System & Outbox Pattern — Interview Q&A

**Focus:** Cases we solved for reliable job enqueue (DB + Redis)  
**Level:** SDE-1 / Backend interviews  
**Pipeline covered:**

```
API validate
  → DB transaction: Notification + Outbox (PENDING)
  → Outbox relay (interval): queue.add(jobId)
  → success / already exists → Outbox PROCESSED
  → Redis fail → leave PENDING, retry
```

---

## Q1. What if the server crashes after saving the notification in DB but before adding the job to Redis?

### Problem
You do two separate steps:

1. Save notification as `PENDING` in Postgres  
2. `queue.add` to Redis  

If the process dies between them, the row stays `PENDING` forever. No job in Redis. No outbox row (if you only write outbox after queue failure). User never gets notified.

### Solution
Use the **transactional outbox** pattern:

1. In **one DB transaction**, insert:
   - `Notification` (`PENDING`)
   - `Outbox` (`PENDING`)
2. **Commit**
3. A background **outbox relay** reads Outbox `PENDING` → `queue.add` → marks Outbox `PROCESSED`

After commit, even if the server dies, the Outbox row remains. The relay will enqueue later.

### Follow-up 1: If the server dies before commit, does outbox still save me?
**Answer:** No — and that is correct. Before commit, both inserts roll back. Nothing is saved. The client should retry the API. You avoid a half-written state (notification without outbox).

### Follow-up 2: Can I put `queue.add` inside the same DB transaction?
**Answer:** No. A Postgres transaction only covers the database. Redis is a different system. `queue.add` cannot join that transaction. Correct order: commit DB (notification + outbox) first, then enqueue (directly or via relay).

### Follow-up 3: Why not scan all Notification rows with status PENDING instead of Outbox?
**Answer:** `PENDING` on Notification means “not delivered to the user yet,” not “not pushed to the queue.” A notification already in Redis waiting to be sent is still `PENDING`. Scanning it again creates **duplicate jobs**. Outbox `PENDING` means specifically “not yet published to the queue.”

---

## Q2. What if Redis is down when we try to enqueue?

### Problem
If you only call `queue.add` after saving the notification, Redis downtime means the job never enters the queue. If you have no durable “must enqueue” record, the notification is stuck.

### Solution
Always write Outbox in the same transaction as Notification. When Redis is down:

- Relay’s `queue.add` fails  
- Do **not** mark Outbox `PROCESSED`  
- Leave Outbox `PENDING`  
- Next interval retry when Redis is back  

API can still return “accepted” after the DB commit, because intent is durable in Postgres.

### Follow-up 1: Should the API return failure if Redis is down but DB commit succeeded?
**Answer (common interview answer):** Prefer **accept the request** (e.g. 202) if Notification + Outbox are committed. Delivery is asynchronous. Returning 500 after durable accept confuses clients and causes duplicate retries. Optionally expose a status API later.

### Follow-up 2: Is “write outbox only when queue.add fails” enough?
**Answer:** No. That is a **fallback**, not a full outbox. Crash between DB save and queue/outbox write still loses the enqueue intent. Always write outbox with the notification; treat Redis as best-effort + relay.

---

## Q3. What if the database is down?

### Problem
You cannot persist Notification or Outbox.

### Solution
Fail the request (e.g. 500/503). Do not pretend the notification was accepted. There is no durable record to retry from.

### Follow-up 1: What if DB works for Notification insert but fails on Outbox insert?
**Answer:** With a real transaction, both roll back. Client retries. Without a transaction, you can get Notification without Outbox — the bug we fixed by using `prisma.$transaction` and **throwing** on failure (not returning `{ success: false }` inside the txn).

### Follow-up 2: Why must repository throw inside a transaction instead of returning `{ success: false }`?
**Answer:** Returning a normal object looks like success to Prisma’s transaction callback, so it may **commit**. Throwing aborts and **rolls back** both writes.

---

## Q4. Explain the outbox relay. Is it a BullMQ Worker?

### Problem
People confuse:

- **BullMQ Worker** → pulls jobs **from Redis** and sends email/SMS  
- **Outbox relay** → scans **Postgres Outbox** and calls `queue.add`

### Solution
Outbox relay is **not** `new Worker(...)`. It is a scheduled loop:

```
every few seconds:
  find Outbox where status = PENDING
  for each row:
    queue.add(notificationId, { jobId })
    if success → mark PROCESSED
    if fail → leave PENDING
```

Reuse the existing `Queue` + Redis connection. Do not put `Worker` in `queue.js` and import it everywhere (side effect: consumer starts on every import).

### Follow-up 1: How do you run the relay on an interval?
**Answer:** `setInterval` from `server.js` (lab), or cron / separate process in production. Start it when the app boots; the file alone does nothing.

### Follow-up 2: Why can setInterval overlap even every 3 seconds?
**Answer:** `setInterval` fires on the clock. It does **not** wait for the previous async run to finish. If one scan takes 10s, the next tick at 3s starts another run → duplicate processing. Fix with an `isRunning` lock:

```
if (isRunning) return
isRunning = true
await outboxWorker()
finally → isRunning = false
```

### Follow-up 3: Why not forEach with await for DB/Redis updates?
**Answer:** `forEach` does not await async callbacks. It fires all iterations quickly and does not wait. Use `for...of` + `await` so each row: add → update → then next.

---

## Q5. What if queue.add succeeds but updating Outbox to PROCESSED fails (DB crash)?

### Problem

```
1. queue.add(101)     ✅ job in Redis
2. Outbox update      💥 DB down → still PENDING
3. Next tick: relay sees PENDING → tries add again → duplicate risk
```

Redis and Postgres are not one transaction. This is **at-least-once** delivery of the enqueue intent.

### Solution (two layers)

1. **Idempotent `jobId`:**  
   `queue.add(..., { jobId: \`notification-${id}\` })`  
   Second add with same jobId does not create a second job.

2. **Treat “already exists” as success** and mark Outbox `PROCESSED` (see Q6).

3. Later, send worker should also be idempotent (skip if already `SENT`).

### Follow-up 1: Can we get exactly-once across DB + Redis?
**Answer:** Practically no across two systems. Aim for **at-least-once + idempotency**.

### Follow-up 2: What does jobId do in simple words?
**Answer:** It is a stable passport for the job in Redis. Same passport twice → BullMQ rejects duplicate instead of creating two jobs.

---

## Q6. Duplicate jobId makes Outbox stuck PENDING forever — why? How do you fix it?

### Problem
After Q5, job is already in Redis with `jobId = notification-101`, Outbox still `PENDING`.

Next relay tick:

1. `queue.add` with same jobId  
2. BullMQ **throws** “already exists”  
3. Your catch returns `{ success: false }`  
4. Relay only marks PROCESSED when `success === true`  
5. Outbox stays PENDING → every 3s same fail loop  

Ironically, `jobId` did its job (blocked duplicate), but your code treated that as failure.

### Solution
In catch, distinguish errors:

```
if message includes "already exists":
  return { success: true }   // job already queued → enqueue done
else:
  return { success: false }  // Redis down etc. → retry later
```

Do **not** return `success: true` for every catch — that would mark PROCESSED when Redis is actually down.

### Follow-up 1: Why is `if (!response)` after queue.add useless?
**Answer:** On failure BullMQ **throws**; it does not return a falsy value. Soft-fail checks belong in `catch`, or in your wrapper’s `{ success }` object.

### Follow-up 2: When do I use throw vs if (response.success)?
**Answer:**

| Situation | Approach |
|-----------|----------|
| Prisma / BullMQ / Redis fail | Usually auto-throw → try/catch |
| Your helper returns `{ success }` | `if (response.success)` |
| Business rule inside transaction | `throw new Error(...)` to rollback |
| `if (!response)` after add/create | Usually useless for these libraries |

---

## Q7. Validation hang — invalid body, request never returns

### Problem
Middleware only called `next()` when valid. On invalid body: no `next()`, no `res.status()`. Express leaves the request open → client spins (hang).

Also `return { error }` does not send an HTTP response.

### Solution

```
safeParse
  if success → return next()
  else → return res.status(400).json({ msg, errors })
catch → return res.status(500).json(...)
```

Must `return next()` so you do not also send 400 after a valid request (double response / headers already sent).

### Follow-up 1: What status codes for accept vs validation vs server error?
**Answer:**  
- Validation fail → **400**  
- Durable accept (async notify) → **202** (or 200)  
- Unexpected / DB down → **500/503**

---

## Q8. End-to-end: “Design how you reliably enqueue a notification job”

### Full answer (interview script)

1. Validate input (400 on fail; never hang).  
2. In one DB transaction: insert Notification + Outbox.  
3. Commit → return accepted to client.  
4. Outbox relay (interval + overlap lock):  
   - PENDING outbox → `queue.add` with stable `jobId`  
   - success or “already exists” → PROCESSED  
   - Redis down → leave PENDING  
5. Separate BullMQ Worker later: consume queue → send email/SMS → mark Notification SENT/FAILED (idempotent).  

Failure modes covered: server crash after commit, Redis down, DB down on accept, duplicate enqueue, interval overlap, async loop mistakes (`forEach`).

### Follow-up 1: What is still missing after enqueue works?
**Answer:** The **send worker** (BullMQ `Worker`), retries/backoff, dead-letter, provider failures, and idempotent send so the user does not get duplicate emails.

### Follow-up 2: Why separate Outbox relay and send Worker?
**Answer:** Different responsibilities and failure domains:

- Relay: DB → Redis (publish intent)  
- Worker: Redis → email provider (deliver)  

Mixing them couples “get into queue” with “send email” and makes retries harder to reason about.

---

## Quick cheat sheet

| Failure | What we do |
|---------|------------|
| DB down on accept | Fail request |
| Crash before commit | Rollback; client retries |
| Crash after commit | Outbox remains; relay enqueues |
| Redis down | Outbox stays PENDING; retry |
| Add OK, PROCESSED update fails | jobId + treat duplicate as success |
| Interval overlap | `isRunning` lock |
| Invalid API body | 400; always respond |
| Async in forEach | Use `for...of` + await |

---

## Suggested score narrative (SDE-1)

- Knowing dual-write pain + outbox: strong  
- Implementing transactional write + relay + jobId + overlap lock: interview-ready for enqueue  
- Still ask about send-worker idempotency and DLQ for full system design  

---

*Generated from backend-engineering-labs notification-service learning session.*
