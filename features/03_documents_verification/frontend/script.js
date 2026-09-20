let currentExtractedData = {};
let currentDocType = '';

async function processDocument() {
    const fileInput = document.getElementById('fileInput');
    const docType = document.getElementById('docType').value;
    const btn = document.getElementById('processBtn');

    if (!fileInput.files.length) {
        alert("Please select a file first!");
        return;
    }

    currentDocType = docType;
    btn.innerText = "Processing with AI...";
    btn.disabled = true;

    // Simulate sending file to backend for OCR
    // In reality: const formData = new FormData(); formData.append('file', fileInput.files[0]);
    setTimeout(async () => {
        try {
            // Mock API call to our new processing endpoint
            const response = await fetchAPI(`/api/documents/process?doc_type=${encodeURIComponent(docType)}`, { method: 'POST' });
            
            currentExtractedData = response.extracted_data;
            renderCrossCheckForm(currentExtractedData);
            
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
            
        } catch (error) {
            alert("Error processing document.");
        } finally {
            btn.innerText = "Process Document AI";
            btn.disabled = false;
        }
    }, 1500);
}

function renderCrossCheckForm(data) {
    const container = document.getElementById('extractedFields');
    container.innerHTML = '';
    
    for (const [key, value] of Object.entries(data)) {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.innerText = key.replace('_', ' ');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `field_${key}`;
        input.value = value;
        
        group.appendChild(label);
        group.appendChild(input);
        container.appendChild(group);
    }
}

async function confirmAndStore() {
    const btn = document.getElementById('confirmBtn');
    btn.innerText = "Saving to Supabase...";
    btn.disabled = true;

    // Gather edited fields
    const finalData = {};
    for (const key of Object.keys(currentExtractedData)) {
        finalData[key] = document.getElementById(`field_${key}`).value;
    }

    // Mock API call to store data
    setTimeout(async () => {
        try {
            await fetchAPI('/api/documents/confirm', {
                method: 'POST',
                body: JSON.stringify({
                    document_type: currentDocType,
                    extracted_data: finalData
                })
            });
            
            // Move from unuploaded to uploaded in UI
            moveDocumentToList(currentDocType);
            resetUpload();
            alert("Document successfully verified and stored!");
            
        } catch (error) {
            alert("Error saving document.");
        } finally {
            btn.innerText = "Looks Good, Verify & Store";
            btn.disabled = false;
        }
    }, 1000);
}

function moveDocumentToList(docName) {
    // Remove from To Upload
    const unuploaded = document.getElementById('unuploadedList');
    for (let li of unuploaded.children) {
        if (li.innerText === docName) {
            unuploaded.removeChild(li);
            break;
        }
    }
    
    // Add to Verified
    const uploaded = document.getElementById('uploadedList');
    const newLi = document.createElement('li');
    newLi.innerText = docName;
    uploaded.appendChild(newLi);
}

function resetUpload() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    document.getElementById('fileInput').value = '';
}
