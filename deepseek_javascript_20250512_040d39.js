// Update the input event listener
document.getElementById('videoUrl').addEventListener('input', async function(e) {
  const url = e.target.value;
  if(isValidYouTubeUrl(url)) {
    showLoader();
    try {
      const response = await fetch('/api/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) throw new Error('Invalid URL');
      
      const data = await response.json();
      populateResolutions(data.formats);
    } catch (error) {
      alert(error.message);
    } finally {
      hideLoader();
    }
  }
});

// Update handleDownload function
async function handleDownload() {
  const url = document.getElementById('videoUrl').value;
  const quality = document.querySelector('.resolution-option.active')?.dataset.quality;
  
  if(!isValidYouTubeUrl(url) {
    alert('Please enter a valid YouTube URL');
    return;
  }
  
  if(!quality) {
    alert('Please select a resolution');
    return;
  }

  showLoader();
  try {
    const downloadUrl = `/download?url=${encodeURIComponent(url)}&quality=${encodeURIComponent(quality)}`;
    window.location.href = downloadUrl;
  } catch (error) {
    alert('Download failed: ' + error.message);
  } finally {
    hideLoader();
  }
}

// Update resolution selection
function selectResolution(res) {
  document.querySelectorAll('.resolution-option').forEach(el => el.classList.remove('active'));
  res.element.classList.add('active');
}