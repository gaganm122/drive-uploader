const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const progressBar = document.getElementById("progress");
const statusText = document.getElementById("status");

uploadBtn.onclick = () => fileInput.click();

fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;
  const MAX_SIZE_MB = 5;
const fileSizeMB = file.size / (1024 * 1024);

if (fileSizeMB > MAX_SIZE_MB) {
  statusText.textContent = `❌ File too large. Max allowed is ${MAX_SIZE_MB} MB.`;
  alert("File is too large!");
  return; // stop here
}


  const formData = new FormData();
  formData.append("file", file);

  statusText.textContent = "Uploading...";
  progressBar.style.width = "0%";

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://drive-uploader-backend-e7wn.onrender.com/upload");

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = percent + "%";
    }
  };

  xhr.onload = () => {
    try {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);

        if (res.success) {
          statusText.textContent =
            "✅ File uploaded successfully to Google Drive!";
          progressBar.style.width = "100%";
          alert("Upload completed successfully!");

          const linkDiv = document.getElementById("fileLink");

          linkDiv.innerHTML = `
    <a href="${res.url}" target="_blank">
      📥 Download uploaded file
    </a>
  `;
        } else {
          throw new Error(res.message || "Upload failed");
        }
      } else {
        throw new Error("Server error");
      }
    } catch (err) {
  console.error("Upload error:", err);

  let message = "Unknown error occurred";

  if (xhr.responseText) {
    try {
      const res = JSON.parse(xhr.responseText);
      if (res.error) message = res.error;
    } catch {
      message = xhr.responseText;
    }
  }

  statusText.textContent = "❌ Upload failed: " + message;
  alert("Upload failed:\n" + message);
}

    
  };

  xhr.onerror = () => {
  statusText.textContent = "❌ Network error: Cannot reach server.";
  alert("Network error: Cannot reach server.");
};


  xhr.send(formData);
};
