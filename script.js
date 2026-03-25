// Auth check
if (!localStorage.getItem("token")) {
  window.location.href = "login.html";
}

// Show logged in user name
const userData = JSON.parse(localStorage.getItem("user"));

if(userData){
  const username = document.getElementById("username");
  if(username){
    username.innerText = userData.name;
  }
}

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");

if(userData){
if(profileName) profileName.innerText = userData.name;
if(profileEmail) profileEmail.innerText = userData.email;
}

// Sidebar navigation
// Select all sidebar links
const sidebarLinks = document.querySelectorAll(".sidebar a");

// Select all page sections
const sections = document.querySelectorAll(".page-section");

// Flag so dashboard animation runs only once
let dashboardAnimated = false;

// Sidebar click handling
sidebarLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault(); // stop page reload

    // Remove active class from all links
    sidebarLinks.forEach(l => l.classList.remove("active"));

    // Add active class to clicked link
    link.classList.add("active");

    // Get target section id
    const target = link.getAttribute("data-section");

    // Show only selected section
    sections.forEach(section => {
      section.classList.remove("active");

      if (section.id === target) {
        section.classList.add("active");

        // Run dashboard animation once
        if (target === "dashboard-section" && !dashboardAnimated) {
          runDashboardAnimations();
          dashboardAnimated = true;
        }

        // Load courses when course section opens
        if (target === "course-section") {
          loadCourses();
        }
      }
    });
  });
});

// Dropdown navigation
const dropdownLinks = document.querySelectorAll("#userDropdown a[data-section]");

dropdownLinks.forEach(link=>{
  link.addEventListener("click",(e)=>{
    e.preventDefault();

    const target = link.getAttribute("data-section");

    sections.forEach(section=>{
      section.classList.remove("active");

      if(section.id === target){
        section.classList.add("active");
      }
    });

    // close dropdown
    document.getElementById("userDropdown").classList.remove("show");
  });
});

// User Menu
function toggleUserMenu(){
  const menu = document.getElementById("userDropdown");
  menu.classList.toggle("show");
}

// Logout
function logout(){
  localStorage.removeItem("token");
  window.location.href="login.html";
}

// Counter animation
function animateCounter(element, target) {
  let count = 0;
  const speed = target / 40;

  const interval = setInterval(() => {
    count += speed;

    if (count >= target) {
      element.innerText = target;
      clearInterval(interval);
    } else {
      element.innerText = Math.floor(count);
    }
  }, 30);
}

// Fetch dashboard data
async function loadDashboardData() {

  try{

  const res = await fetch("http://localhost:5000/api/dashboard", {
    headers:{
      Authorization:"Bearer "+localStorage.getItem("token")
    }
  });

  const data = await res.json();

  const enrolled = data.enrolled || 0;
  const completed = data.completed || 0;
  const inProgress = data.inProgress || 0;
  const certificates = data.certificates || 0;

  const cards = document.querySelectorAll(".card p");

  animateCounter(cards[0], enrolled);
  animateCounter(cards[1], completed);
  animateCounter(cards[2], inProgress);
  animateCounter(cards[3], certificates);

  }catch(error){
    console.log("Dashboard error",error);
  }
}

function runDashboardAnimations() {
  loadDashboardData();

  setTimeout(() => {
    document.getElementById("htmlBar").style.width = "80%";
    document.getElementById("jsBar").style.width = "45%";
  }, 300);
}


// Initial load animation
 window.onload = () => {
  runDashboardAnimations();
};


// course section 
const coursesContainer = document.getElementById("coursesContainer");

async function loadCourses() {
  try {
    coursesContainer.innerHTML = "<p>Loading courses...</p>";

    const response = await fetch("http://localhost:5000/api/courses");
    const courses = await response.json();

    coursesContainer.innerHTML = ""; // clear old content

    courses.forEach(course => {
      const courseCard = document.createElement("div");
      courseCard.classList.add("course-card");

      courseCard.innerHTML = `
        <h3>${course.title}</h3>
        <p class="category">${course.category}</p>

        <div class="progress-wrapper">
          <div class="course-progress-bar">
             <div class="progress-fill" style="width:${course.progress}%"></div>
          </div>

          <span>${course.progress}%</span>
        </div>

        <span class="status ${course.status}">
          ${course.status.toUpperCase()}
        </span>
      `;

      coursesContainer.appendChild(courseCard);
    });

  } catch (error) {
    console.error("Error loading courses:", error);
    coursesContainer.innerHTML = "<p>Failed to load courses</p>";
  }
}

