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

//监听阿里云iot连接
device.on('connect',()=>{
    //每满一个小时请求一次数据
    const throttleFn = throttle(requestWeatherData,3600000);
    //当aliyun连接上了以后，就开始请求数据。每隔1s钟轮询一次。
    setInterval(() => {
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
    baseURL:"http://api.map.baidu.com",//配置根路径
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
    requestData('/telematics/v3/weather',{
        location:'成都',
        output:"json",
        ak:"3p49MVra6urFRGOT9s8UBWr2"
    }).then(res=>{
        const {data} = res;
        if(data.status !== 'success'){
            console.log(`数据请求失败，状态为:${data.status}`);
        }else{
            handleData(data);//如果获取成功，就把数据进行处理
        }        
    })
}

/**
 * 将得到数据进行处理返回
 * @param {object} data 
 */
function handleData (data){
    const {date} = data.results[0].weather_data[0];
    const str = date.replace(/\s*/g,"");
    const index = str.indexOf("℃");
    let numStr = str.substring(index-3,index);
    //判断是否存在-号,如果不是-号则重新进行取值
    +numStr !== +numStr && (numStr = Number(str.substring(index-2,index))); 
    let hum = humRandom(71,75);
    console.log(`开始发送数据,当前温度:${numStr},随机的湿度值是:${hum}`);
    device.postProps({
        tem:numStr,
        hum:hum //随机生成的(60~80之间的)湿度的值
    });//将处理完成后的数据给予阿里云实例发送
}

/** max和min分别代表最大值和最小值
 * 生成在最大最小值范围内的随机的湿度值
 * @param {Number} max 
 * @param {Number} min 
 */
function humRandom(min,max){
    return +(Math.random()*(max-min+1)+min).toFixed(2);
}