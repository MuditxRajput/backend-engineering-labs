export const convertToBase62 =(num)=>{
     const char = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
     let result = "";
     if(num==0) return "0";
     while(num>0)
     {
        let rem = num%62;
        result = char[rem] + result;
        num = Math.floor(num/62);
     }
     return result;
}