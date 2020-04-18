const axios = require('axios').default;
const iot = require('alibabacloud-iot-device-sdk');

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
const requestWeatherData = (url,data,methods='GET')=>{
    return new Promise(resolve=>{
        let result = null;
            if(methods === 'GET'){
                result = instance.get(url,{
                    params:data
                })
            }else{
                result =  instance.post(url,data);
            }
        result.then(res=>{
            resolve(res);
        },err=>{
            console.log(`请求失败:${err}`);
        })       
    })
}

//请求的参数对象
const params = {
    location:'成都',
    output:"json",
    ak:"3p49MVra6urFRGOT9s8UBWr2"
}

/**
 * 将得到的promise数据进行简单处理后返回
 */
const handleData = async ()=>{
    const {data} = await requestWeatherData('/telematics/v3/weather',params);
    let tem = null;
    if(data.status !== 'success'){
        console.log(`数据请求失败，状态为:${data.status}`);
    }else{
        const {date} = data.results[0].weather_data[0];
        const str = date.replace(/\s*/g,"");
        const index = str.indexOf("℃");
        let numStr = str.substring(index-3,index);
        //判断是否存在-号,如果不是-号则重新进行取值
        +numStr !== +numStr && (numStr = Number(str.substring(index-2,index))); 
        tem = numStr;
    }
    return tem;
}
//返回当前的温度值
handleData()

/*阿里云连接部分*/

