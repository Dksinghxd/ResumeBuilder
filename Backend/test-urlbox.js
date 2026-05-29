import axios from 'axios';
import fs from 'fs';

const apiKey = 'ur_live_EwOzu9BOkW6HG1UwEa3J_qPpjm9Jbfe0';

async function testUrlboxGet() {
  try {
    console.log('Sending GET request to Urlbox with new key...');
    const response = await axios.get(
      `https://api.urlbox.com/v1/${apiKey}/pdf?url=https://example.com`,
      {
        responseType: 'arraybuffer'
      }
    );

    fs.writeFileSync('test-output.pdf', Buffer.from(response.data));
    console.log('Success! Saved output to test-output.pdf');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error:', error.response?.status, error.response?.data ? Buffer.from(error.response.data).toString('utf8') : error.message);
    } else {
      console.error('Error:', error);
    }
  }
}

testUrlboxGet();
