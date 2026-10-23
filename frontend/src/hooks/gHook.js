
import { useSession } from '../context/SessionContext';
import {useGoogleLogin} from '@react-oauth/google'
import { loginOAuth } from '../services/api';
import { useNavigate } from 'react-router-dom';

const notify = options => import('sweetalert2').then(({ default: Swal }) => Swal.fire(options));


  export const useGoogleHook = (path) => {
    let navigate = useNavigate();
    const { refreshSession } = useSession();
    return useGoogleLogin({
    onSuccess: async (tok) => {
      try {
        // The backend verifies the Google token and retrieves the profile once.
        const response = await loginOAuth({ accessToken: tok.access_token });
        if (!await refreshSession()) throw new Error("Session cookie unavailable");
        notify({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Login Success!",
          showConfirmButton: false,
          timer: 4000,
        });
        localStorage.setItem('token', response.token);
        localStorage.setItem('user_role', response.user.role);
        localStorage.setItem('user_name', response.user.name);
        navigate(path, { replace: true });
      }
      catch(error) {
        notify({
          toast: true,
          position: "top-end",
          icon: "error",
          title: 'Google sign-in could not be completed. Please try again.',
          showConfirmButton: false,
          timer: 5000,
        });
      }
    },
    onError: async (error) => {
      notify({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Google sign-in could not be completed. Please try again.",
        showConfirmButton: false,
        timer: 6000,
      });
    }
  })
  }
