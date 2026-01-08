const API_KEY = "AIzaSyBt_SQztqDSzzq59sy_4Y82SRCy_xPaU6M"; 

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${API_KEY}`;

function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('preview');
        preview.src = reader.result;
        preview.style.display = 'block';
        document.getElementById('analyze-btn').disabled = false;
    };
    if(event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

async function analyzePlant() {
    const fileInput = document.getElementById('file-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loader = document.getElementById('loader');
    const resultDiv = document.getElementById('result');

    if (fileInput.files.length === 0) {
        alert("Please select an image first.");
        return;
    }

    analyzeBtn.style.display = 'none';
    loader.style.display = 'block';
    resultDiv.style.display = 'none';

    try {
        const base64Image = await toBase64(fileInput.files[0]);
        const strippedBase64 = base64Image.split(',')[1];

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { 
                          text: "Identify the plant disease. Return strictly valid JSON with keys: 'disease' (name), 'treatment' (A detailed 10-15 line explanation. Include symptoms, causes, and step-by-step cure instructions), 'medicine' (name of medicine/pesticide in single word). If healthy, return 'Healthy' for disease. Do not use Markdown formatting." 
                        },
                        { inlineData: { mimeType: "image/jpeg", data: strippedBase64 } }
                    ]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("The AI could not analyze this image. Try a clearer photo.");
        }

        const rawText = data.candidates[0].content.parts[0].text;
        
        const cleanJson = rawText.replace(/```json|```/g, "").trim();
        const result = JSON.parse(cleanJson);

        displayResult(result);

    } catch (error) {
        console.error("Full Error Details:", error);
        alert("Error analyzing image: " + error.message);
    } finally {
        analyzeBtn.style.display = 'block';
        loader.style.display = 'none';
    }
}

function displayResult(data) {
    const resultDiv = document.getElementById('result');
    const diseaseH3 = document.getElementById('disease-name');
    const treatmentP = document.getElementById('treatment-info');
    const mapsContainer = document.getElementById('maps-link-container');

    resultDiv.style.display = 'block';
    diseaseH3.innerText = data.disease || "Unknown Issue";
    treatmentP.innerText = data.treatment || "No treatment information available.";

    if (data.disease && data.disease.toLowerCase() !== "healthy") {
        const medicine = data.medicine || "plant pesticide";
        const searchQuery = encodeURIComponent(medicine + " store nearby");
        
        const googleMapsUrl = `https://www.google.com/maps/search/${searchQuery}`;

        mapsContainer.innerHTML = `
            <a href="${googleMapsUrl}" target="_blank" style="display: block; width: 100%; margin-top: 20px; background-color: #d32f2f; color: white; text-align: center; padding: 15px; text-decoration: none; font-size: 18px; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2); margin: 0 auto;">
                📍 Find <span>${medicine}</span> Nearby
            </a>`;
    } else {
        mapsContainer.innerHTML = `<p style="color: green; font-weight: bold; margin-top: 15px; text-align: center;">✅ Great news! Your plant looks healthy.</p>`;
    }
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}