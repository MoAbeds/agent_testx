const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyCh1QuOzfYbP9aj8HgRDHm0SG6Qxx99eb8');

async function list() {
  try {
    // There isn't a direct listModels in the simple SDK usually, 
    // but we can try a known one or check the error.
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
    const result = await model.generateContent("hi");
    console.log(result.response.text());
  } catch (e) {
    console.error(e);
  }
}
list();
