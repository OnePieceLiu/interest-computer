module.exports = (ctx, next)=>{
    const {openid, session_key} = ctx;
    console.log(openid, session_key)
    ctx.body = 'test'
}