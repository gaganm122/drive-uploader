const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const progressBar = document.getElementById("progress");
const statusText = document.getElementById("status");

uploadBtn.onclick = () => fileInput.click();

fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  statusText.textContent = "Uploading...";
  progressBar.style.width = "0%";

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:5000/upload");

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
          statusText.textContent = "✅ File uploaded successfully to Google Drive!";
          progressBar.style.width = "100%";
          alert("Upload completed successfully!");
        } else {
          throw new Error(res.message || "Upload failed");
        }
      } else {
        throw new Error("Server error");
      }
    } catch (err) {
      console.error(err);
      statusText.textContent = "❌ Upload failed!";
      alert("Upload failed. Please try again.");
    }
  };

  xhr.onerror = () => {
    statusText.textContent = "❌ Network error!";
    alert("Network error. Is the server running?");
  };

  xhr.send(formData);
};
