document.addEventListener("DOMContentLoaded", function() {
    // Get the form and post container
    const postForm = document.getElementById('postForm');
    const postsContainer = document.getElementById('postsContainer');
    
    // Handle form submission
    postForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission
        
        // Get form data
        const subject = postForm.subject.value;
        const message = postForm.message.value;
        const file = postForm.file.files[0]; // Handle file upload (if any)
        
        // Validate form data
        if (!subject || !message) {
            alert("Subject and Message are required!");
            return;
        }
        
        // Create a new post object (for local display)
        const newPost = {
            subject: subject,
            message: message,
            date: new Date().toISOString(),
            replyCount: 0,
            file: file ? { thumb: URL.createObjectURL(file) } : null
        };
        
        // Append the new post to the container
        displayPost(newPost);
        
        // Optionally, you can clear the form after submission
        postForm.reset();
    });
    
    // Function to display posts
    function displayPost(post) {
        const postElement = document.createElement('div');
        postElement.classList.add('item');
        
        // Post content
        postElement.innerHTML = `
            <div class="image">
                ${post.file ? `<img src="${post.file.thumb}" alt="Post image">` : ''}
            </div>
            <div class="content">
                <div class="header">${post.subject || '(Sin asunto)'}</div>
                <div class="meta">
                    <span><i class="icon comments"></i> ${post.replyCount} respuestas</span>
                    <span><i class="icon wait"></i> ${new Date(post.date).toLocaleString()}</span>
                </div>
                <div class="description"><p>${post.message.substr(0, 256)}</p></div>
            </div>
        `;
        
        // Add the new post to the posts container
        postsContainer.prepend(postElement);
    }
});
