const formContainer = document.querySelector('#form-container');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const loginBtn = document.querySelector('#login-submit-btn');
const newUserBtn = document.querySelector('#new-user-btn');
const registerBtn = document.querySelector('#register-btn');
const backBtn = document.querySelector('#back-btn');
const modals = document.querySelectorAll('.modal');
const togglePasswordButtons = document.querySelectorAll('.toggle-password');
const incorrectModal = document.querySelector('#incorrect-modal');
const successModal = document.querySelector('#success-modal');
const unavailableModal = document.querySelector('#unavailable-modal');
const passwordMismatchModal = document.querySelector('#password-mismatch-modal');
const passwordReqModal = document.querySelector('#password-req-modal');

loginBtn.addEventListener('click', (event) => {
  event.preventDefault(); // prevent the form from submitting normally
  const username = document.querySelector('#login-username').value;
  const password = document.querySelector('#login-password').value;
  
  const userData = {
    username,
    password,
  };
  
  fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error('Network response was not ok');
  })
  .then(data => {
    if (data.success) {
      window.location.href = '/flashcards.html';
    } else if (data.error) {
      if (data.error === 'Invalid username or password') {
        showIncorrectModal();
        
        setTimeout(() => {
          hideModal();
        }, 2000);
      } else {
        console.log(data.error);
      }
    }
  });
});

registerBtn.addEventListener('click', (event) => {
  event.preventDefault(); 
  const username = document.querySelector('#register-username').value;
  const password = document.querySelector('#register-password').value;
  const confirmPassword = document.querySelector('#confirm-password').value;
  
    if (!/^\d{4}$/.test(password)) {
    event.preventDefault();
    showPasswordReqModal();
    
    setTimeout(() => {
      hidePasswordReqModal();
    }, 2000);
    
    return;
  };
  
  if (password !== confirmPassword) {
    event.preventDefault();
    showPasswordMismatchModal();
    
    setTimeout(() => {
      hideModal();
    }, 2000);
    
    return;
  };
  
  const userData = {
    username,
    password,
    confirmPassword,
  };
  
  fetch('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      window.location.href = '/landing.html';
      
      showSuccessModal();
      
      setTimeout(() => {
        hideSuccessModal();
        shiftFormsToLogin();
      }, 2000);
    } else if (data.error) {
      if (data.error === 'User already exists') {
        showUnavailableModal();
        
        setTimeout(() => {
          hideModal();
        }, 2000);
      } else {
        console.log(data.error);
      };
    };
  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  });
});

newUserBtn.addEventListener('click', () => {
  console.log('Add new user form button clicked...');
  shiftFormsToRegister();
});

backBtn.addEventListener('click', () => {
  console.log('Back button to go to login form clicked...');
  shiftFormsToLogin();
});

togglePasswordButtons.forEach(function(button) {
  button.addEventListener('click', function() {
    const wrapper = this.parentElement;
    const passwordInput = wrapper.querySelector('input[type=password], input[type=text]');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    const slashIcon = wrapper.querySelector('.fa-regular.fa-eye-slash');
    const eyeIcon = wrapper.querySelector('.fa-solid.fa-eye');
    
    if (type === 'text') {
      slashIcon.classList.add('hide');
      eyeIcon.classList.remove('hide');
    } else {
      slashIcon.classList.remove('hide');
      eyeIcon.classList.add('hide');
    }
  });
});

//* MODAL FUNCTIONS
modals.forEach(modal => { 
  modal.addEventListener('click', (event) => {
    event.stopPropagation();
  });
});

const hideModal = () => {
  modals.forEach(modal => {
    modal.classList.add('hide');
  }); 
};

modals.forEach(modal => {
  modal.addEventListener('click', hideModal);
});

const showIncorrectModal = () => {
  incorrectModal.classList.remove('hide');
};

const showSuccessModal = () => {
  successModal.classList.remove('hide');
};

const showUnavailableModal = () => {
  unavailableModal.classList.remove('hide');
};

const showPasswordMismatchModal = () => {
  passwordMismatchModal.classList.remove('hide');
};

const showPasswordReqModal = () => {
  passwordReqModal.classList.remove('hide');
};

//* HELPER FUNCTIONS
const shiftFormsToRegister = () => {
  formContainer.classList.add('shift-left');
  formContainer.classList.remove('shift-right');
  
  loginForm.classList.remove('fade-in');
  loginForm.classList.add('fade-out');
  loginForm.style.pointerEvents = 'none';
  
  registerForm.classList.remove('fade-out'); 
  registerForm.classList.add('fade-in');
  registerForm.style.pointerEvents = 'auto';
};

const shiftFormsToLogin = () => {
  formContainer.classList.add('shift-right');
  formContainer.classList.remove('shift-left');
  
  loginForm.classList.remove('fade-out');
  loginForm.classList.add('fade-in');
  loginForm.style.pointerEvents = 'auto'; 
  
  registerForm.classList.remove('fade-in');
  registerForm.classList.add('fade-out');
  registerForm.style.pointerEvents = 'none';
};


// let googleClientID; 

// const fetchConfig = async () => {
//   try {
//     const response = await fetch('/config');
//     const config = await response.json();
    
//     googleClientID = config.GOOGLE_CLIENT_ID;
//     console.log('googleClientID LOADED...'); 
    
//     initGoogleSignIn();
//   } catch (error) {
//     console.error('Error fetching configuration:', error);
//   }
// };
// fetchConfig();

//*   GOOGLE AUTHENTICATION & AUTHORIZATION   *//

// // Redirect user to Google's authentication page
// const googleAuth = () => {
//   window.location.href = '/authorize';
// };

// // Initialize Google Sign-In
// const initGoogleSignIn = () => {
//   google.accounts.id.initialize({
//     client_id: googleClientID,
//     callback: handleCredentialResponse,
//     on_failure: onSignInFailure
//   });
  
//   google.accounts.id.renderButton(
//     document.getElementById('google-signin'),
//     { theme: 'outline', size: 'large', text: 'sign_in_with', logo_alignment: 'left' }
//   );
// };

// // Sign in success callback
// const handleCredentialResponse = async (response) => {
//   console.log('handleCredentialResponse CALLED...');
//   let decodedUserInfo;
//   try {
//     console.log('Encoded JWT ID token RETRIEVED...')
//     decodedUserInfo = jwt_decode(response.credential);
//     console.log('Decoded User Info LOADED...');
//   } catch (error) {
//     console.error('Error decoding user credential:', error);
//   }
  
//     await googleAuth();
// };

// const onSignInFailure = (error) => {
//   console.error('Sign-in error:', error);
// };

// const checkAuthentication = async () => {
//   try {
//     console.log('Checking authentication...');
//     const response = await fetch('/is-authenticated', { credentials: 'include' });
//     if (!response.ok) {
//       console.error(`Server responded with status: ${response.status}`);
//       throw new Error(`Server responded with status: ${response.status}`);
//     }
//     const data = await response.json();
    
//     if (data.isAuthenticated) {
//       console.log('User is authenticated.');
//       sessionStorage.setItem('authenticationChecked', 'true');
      
//       try {
//         const photosData = await fetchPhotosData();
//         savePhotosData(photosData);
//         localStorage.setItem('photos', JSON.stringify(photosData));
//       } catch (error) {
//         console.error('Error fetching new photos:', error);
//       }
      
//       if (window.location.pathname === '/landing.html') {
//         window.location.href = '/flashcards.html';
//       }
      
//     } else {
//       console.log('User is not authenticated.');
//       if (window.location.pathname === '/flashcards.html') {
//         window.location.href = '/landing.html';
//       }
//     } 
//   } catch (error) {
//     console.error('Error checking authentication:', error);
//   }
// };

// // Call checkAuthentication when the page initially loads
// window.addEventListener('load', checkAuthentication);
// // Call checkAuthentication when the page refreshes
// window.addEventListener('beforeunload', () => {
//   sessionStorage.removeItem('authenticationChecked');
// });
