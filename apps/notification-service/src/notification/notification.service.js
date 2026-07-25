
   const set = new Set();
export const createNotificationService=async(n)=>{
   console.log("Business Logic Running...");
    if(!n.event || n.event==="") return {
        success:false,
        message : "No event present.."
    }
    // make a new memory set ...
 
    const key = `${n.event}:${n.data.orderId}`;
    console.log(key);
    
    if(set.has(key))
    {
        return {
            success:false,
            message : 'Duplicate notification..'
        }
    }
    set.add(key);
    // console.log(n);

    return {

        success:true,
        message: "Notification Accepted"
    };
}