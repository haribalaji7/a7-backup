import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testApi() {
  try {
    const formData = new FormData();
    const dummyPath = path.join(__dirname, 'dummy.wav');
    fs.writeFileSync(dummyPath, Buffer.from([0]));
    
    formData.append('file', fs.createReadStream(dummyPath), 'dummy.wav');

    console.log("Sending POST request to Dhwani API: https://dwani.hf.space/v1/speech_to_speech_v2?language=english");
    const res = await axios.post('https://dwani.hf.space/v1/speech_to_speech_v2?language=english', formData, {
      headers: formData.getHeaders()
    });

    console.log("Success! Status:", res.status);
    console.log("Data:", res.data);
  } catch (error) {
    if (error.response) {
      console.error("Error Status:", error.response.status);
      console.error("Error Data:", error.response.data);
    } else {
      console.error("Error message:", error.message);
    }
  }
}

testApi();
