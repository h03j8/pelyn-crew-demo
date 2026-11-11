import {createGenerateHandler} from '../server/generate.js';
export default {fetch:createGenerateHandler(()=>({key:process.env.OPENAI_API_KEY??'',code:process.env.TEST_ACCESS_CODE??''}))};
