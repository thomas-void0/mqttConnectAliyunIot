const axios = require('axios').default;
const iot = require('alibabacloud-iot-device-sdk');

/*阿里云连接部分*/
// 设备信息
let device = null;
device = iot.device({
    productKey:'a1OdnwoWT8M', //产品key
    deviceName:'FO4bzjouQ8rwNFPN3sB4', //设备名称
    deviceSecret:'FDBM2DXJjH602GxTesxSXcaosYE3ytoZ',//密匙 

    //支付宝小程序和微信小程序额外需要配置协议参数
    // "protocol": 'alis://', "protocol": 'wxs://',
});
let timeId = null;
//监听阿里云iot连接
device.on('connect',()=>{
    //每满一个小时请求一次数据
    const throttleFn = throttle(requestWeatherData,3600000);
    //当aliyun连接上了以后，就开始请求数据。每隔1s钟轮询一次。
    timeId = setInterval(() => {
        throttleFn();
    }, 1000);
})

//设备连接出错
device.on('error', (err) => {
    console.log(`设备连接出错:${err}`);
});

//监听阿里云iot连接断开,重新连接设备
device.on('close',()=>{
    console.log(`连接断开，开始重新连接`);
    clearInterval(timeId);
    device = iot.device({
        productKey:'a1OdnwoWT8M', //产品key
        deviceName:'FO4bzjouQ8rwNFPN3sB4', //设备名称
        deviceSecret:'FDBM2DXJjH602GxTesxSXcaosYE3ytoZ',//密匙 
    });
})

//函数节流
function throttle(fn,waitTime){
    let oldTime = 0;
    return function(){
        let nowTime = Date.now();
        if(nowTime - oldTime >= waitTime){
            oldTime = nowTime;
            fn.apply(this,...arguments);
        }
    }
}


/*数据请求部分*/
const instance = axios.create({
    baseURL:"https://free-api.heweather.net/s6",//配置根路径
    timeout:5000,//设置超时时间为5s
});

/**
 * 发起数据请求
 * @param {string} url 
 * @param {object} data 
 * @param {string} methods 
 */
function requestData (url,data,methods='GET'){
    return new Promise(resolve=>{
        let result = null;
            if(methods === 'GET'){
                result = instance.get(url,{
                    params:data
                })
            }else{
                result = instance.post(url,data);
            }
        result.then(res=>{
            resolve(res);
        },err=>{
            console.log(`请求失败:${err}`);
        })       
    })
}

/**
 * 请求数据
 */
function requestWeatherData (){
    requestData('weather/now',{
        location:'chengdu',
        key:"f09538c5d09b4150b6c89751457276e1",
    }).then(res=>{
        const {now} = res.data.HeWeather6[0];
        if(res.statusText !== 'OK'){
            console.log(`数据请求失败，状态为:${res.statusText}`);
        }else{
            let {tmp,hum} = now;
            console.log(`温度数据为:${tmp},湿度数据为:${hum}`);
            device.postProps({
                tem:Number(tmp),
                hum:Number(hum) 
            });//将处理完成后的数据给予阿里云实例发送
        }        
    })
}
