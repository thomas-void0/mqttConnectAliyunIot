const axios = require('axios').default;
const iot = require('alibabacloud-iot-device-sdk');

/*阿里云连接部分*/
// 设备信息
const device = iot.device({
    productKey:'a1OdnwoWT8M',
    deviceName:'FO4bzjouQ8rwNFPN3sB4',
    deviceSecret:'FDBM2DXJjH602GxTesxSXcaosYE3ytoZ',

    //支付宝小程序和微信小程序额外需要配置协议参数
    // "protocol": 'alis://', "protocol": 'wxs://',
});

//监听阿里云iot连接
device.on('connect',()=>{
    //当aliyun连接上了以后，就开始请求数据。
    requestWeatherData()
})

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
 */
function handleData (data){
    const {date} = data.results[0].weather_data[0];
    const str = date.replace(/\s*/g,"");
    const index = str.indexOf("℃");
    let numStr = str.substring(index-3,index);
    //判断是否存在-号,如果不是-号则重新进行取值
    +numStr !== +numStr && (numStr = Number(str.substring(index-2,index))); 
    console.log(`开始发送数据,当前温度:${numStr}`);
    device.postProps({tem:numStr});//将处理完成后的数据给予阿里云实例发送
}

