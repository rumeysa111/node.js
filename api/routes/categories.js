var express = require('express')
var router =express.Router();

const isAuthhenticated=false;
router.all("*",(req,res,next)=>{
    if(isAuthhenticated){
        next();
    }else{
        res.json({success: false,error: "not authenticated"});
    }
})

// get user listing
router.get('/',function(req,res,next){
   res.json({success: true})

});
module.exports  = router;