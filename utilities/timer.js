function delay(t, val) {
    //return new Promise(function(resolve) {
        setTimeout(function() {
            console.log('resolving..')
        }, t);
    //});
 }

function runTimeout(){
    delay(5000);
    console.log('continuing')
}
runTimeout();