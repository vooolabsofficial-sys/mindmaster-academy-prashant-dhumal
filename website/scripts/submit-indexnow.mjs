// IndexNow Auto-Submission Script for mindmasteredu.in
// Submits all canonical URLs to IndexNow (Bing, Yandex, Seznam, Naver)

const HOST = 'mindmasteredu.in';
const KEY = 'c7a5f6e8b4924c238b97d14210a567e9';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const URLS = [
  `https://${HOST}/`,
  `https://${HOST}/courses`,
  `https://${HOST}/about`,
  `https://${HOST}/demo-hub`,
  `https://${HOST}/brain-games`,
  `https://${HOST}/results`,
  `https://${HOST}/contact`,
  `https://${HOST}/verify-certificate`,
  `https://${HOST}/privacy-policy`,
  `https://${HOST}/terms`,
  `https://${HOST}/refund-policy`
];

async function submitIndexNow() {
  console.log(`Submitting ${URLS.length} URLs to IndexNow API...`);
  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: URLS
      })
    });

    console.log(`IndexNow response status: ${response.status} ${response.statusText}`);
    if (response.status === 200 || response.status === 202) {
      console.log('✓ Successfully notified IndexNow search engines!');
    } else {
      const text = await response.text();
      console.log('Response body:', text);
    }
  } catch (err) {
    console.error('Error submitting to IndexNow:', err.message);
  }
}

submitIndexNow();
