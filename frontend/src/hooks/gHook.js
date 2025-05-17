
import Swal from 'sweetalert2'
import {useGoogleLogin} from '@react-oauth/google'
import { loginOAuth } from '../services/api';
import { useNavigate } from 'react-router-dom';

  export const useGoogleHook = (path,raw) => {
    let navigate = useNavigate();
    return useGoogleLogin({
    onSuccess: async (tok) => {
      try {
        let url = 'https://www.googleapis.com/oauth2/v3/userinfo';
        //let url = 'https://www.googleapis.com/userinfo/v2/me';
        let user = await fetch(url,{
          method: 'GET',
          headers: {
            'Authorization': 'Bearer '+tok.access_token
          }
        });
        let data = await user.json();
        //console.log('User ->',data);
        data['access_token']=tok.access_token;
        const response = await loginOAuth(data);
        Swal.fire({
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
        if(raw)
            window.location.href=path;
        else 
            navigate(path);
      }
      catch(error) {
        //console.log('Error',error);
      }
    },
    onError: async (error) => {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Login Failed!",
        showConfirmButton: false,
        timer: 4000,
      });
    }
  })
  }