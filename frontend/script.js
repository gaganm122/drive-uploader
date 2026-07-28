const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const progressBar = document.getElementById("progress");
const statusText = document.getElementById("status");
const fileLink = document.getElementById("fileLink");

// Backend URL
const API_URL = "https://drive-uploader-backend-e7wn.onrender.com/upload";

// Open file picker
uploadBtn.addEventListener("click", () => {
    fileInput.click();
});

// Handle file selection
fileInput.addEventListener("change", () => {

    const file = fileInput.files[0];

    if (!file) return;

    // -----------------------------
    // Allowed File Types
    // -----------------------------
    const allowedExtensions = [
        "jpg",
        "jpeg",
        "png",
        "pdf",
        "doc",
        "docx"
    ];

    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    const extension = file.name.split(".").pop().toLowerCase();

    if (
        !allowedExtensions.includes(extension) ||
        !allowedMimeTypes.includes(file.type)
    ) {

        statusText.textContent =
            "❌ Only JPG, PNG, PDF, DOC and DOCX files are allowed.";

        alert("Invalid file type.");

        fileInput.value = "";

        return;
    }

    // -----------------------------
    // File Size Validation
    // -----------------------------
    const MAX_SIZE_MB = 5;

    const fileSize = file.size / (1024 * 1024);

    if (fileSize > MAX_SIZE_MB) {

        statusText.textContent =
            `❌ Maximum file size is ${MAX_SIZE_MB} MB`;

        alert("File exceeds maximum size.");

        fileInput.value = "";

        return;
    }

    uploadFile(file);

});


// =====================================================
// Upload Function
// =====================================================

function uploadFile(file) {

    const formData = new FormData();

    formData.append("file", file);

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";

    progressBar.style.width = "0%";

    statusText.textContent = "Uploading...";

    fileLink.innerHTML = "";

    const xhr = new XMLHttpRequest();

    xhr.open("POST", API_URL, true);

    // Progress

    xhr.upload.onprogress = (event) => {

        if (event.lengthComputable) {

            const percent = Math.round(
                (event.loaded / event.total) * 100
            );

            progressBar.style.width = percent + "%";

        }

    };

    // Success

    xhr.onload = () => {

        uploadBtn.disabled = false;

        uploadBtn.textContent = "Choose File";

        if (xhr.status !== 200) {

            handleError(xhr);

            return;

        }

        try {

            const response = JSON.parse(xhr.responseText);

            if (!response.success) {

                throw new Error(response.error);

            }

            progressBar.style.width = "100%";

            statusText.textContent =
                "✅ File uploaded successfully.";

            const downloadLink = document.createElement("a");

            downloadLink.href = response.url;

            downloadLink.target = "_blank";

            downloadLink.textContent =
                `📥 Download ${response.filename}`;

            fileLink.innerHTML = "";

            fileLink.appendChild(downloadLink);

            fileInput.value = "";

        }

        catch (err) {

            statusText.textContent =
                "❌ " + err.message;

        }

    };

    // Network Error

    xhr.onerror = () => {

        uploadBtn.disabled = false;

        uploadBtn.textContent = "Choose File";

        statusText.textContent =
            "❌ Unable to connect to server.";

    };

    xhr.send(formData);

}


// =====================================================
// Error Handler
// =====================================================

function handleError(xhr) {

    let message = "Upload failed.";

    try {

        const response = JSON.parse(xhr.responseText);

        message = response.error;

    }

    catch {

        message = xhr.responseText;

    }

    statusText.textContent = "❌ " + message;

}