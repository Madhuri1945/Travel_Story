import PasswordInput from "../../components/input/PasswordInput";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("please enter valid password");
      return;
    }

    setError("");
    try {
      const response = await axiosInstance.post("http://localhost:3000/login", {
        email: email,
        password: password,
      });
      if (response.data && response.data.Token) {
        localStorage.setItem("token", response.data.Token);

        navigate("/dashboard");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("An unexpected error occured. Please try again");
        console.log(err);
      }
    }
  };
  return (
    <div className="h-screen bg-cyan-50 overflow-hidden relative ">
      <div className="login-ui-box right-60 -top-10" />
      <div className="login-ui-box bg-cyan-50 left-150 -bottom-40 " />
      <div className="container h-screen flex items-center justify-center px-20 mx-auto">
        <div className="w-2/4 h-[90vh] flex items-center">
          <div
            className="w-2/4 h-[90vh]   flex flex-col justify-end  bg-cover bg-login-bg-img bg-center rounded-lg p-10 z-50 "
            style={{ backgroundImage: "url('./src/assets/Login.png')" }}
          >
            <h4 className="text-4xl text-white font-semibold leading-[35px]">
              Capture Your <br />
              Journey
            </h4>
            <p className="text-[15px] text-green-100 leading-6 pr-7 mt-4">
              Record your travel experiences and memories in your personal
              travel journal.
            </p>
          </div>
          <div className="w-2/4 h-[75vh]  bg-white rounded-r-lg relative p-16 shadow-lg shadow-cyan-200/20">
            <form onSubmit={handleLogin}>
              <h4 className="text-2xl font-semibold mb-7 cursor-pointer">
                Login
              </h4>
              <input
                type="text"
                placeholder="Email"
                className="input-box"
                value={email}
                onChange={({ target }) => {
                  setEmail(target.value);
                }}
              />
              <PasswordInput
                value={password}
                onChange={({ target }) => {
                  setPassword(target.value);
                }}
              />
              {error && <p className="text-red-500 text-xs pb-1">{error}</p>}
              <button type="submit" className="btn-primary ">
                LOGIN
              </button>
              <p className="text-xs text-slate-500 text-center my-4">Or</p>
              <button
                className="btn-primary btn-light "
                onClick={() => {
                  navigate("/signup");
                }}
              >
                CREATE ACCOUNT
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
