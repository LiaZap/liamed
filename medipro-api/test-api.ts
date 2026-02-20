import axios from 'axios';

async function test() {
    try {
        console.log('Testing Login...');
        const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'tiago.carlos.sulzbach@gmail.com',
            password: 'Medico@123'
        });

        const token = loginRes.data.token;
        console.log('✅ Login successful. Token obtained.');

        console.log('Testing Get Stats...');
        const statsRes = await axios.get('http://localhost:4000/api/consults/stats', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Stats Response:', statsRes.data);

        console.log('Testing Get Consults...');
        const consultsRes = await axios.get('http://localhost:4000/api/consults', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Consults Response: ${consultsRes.data.length} items found.`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    }
}

test();
