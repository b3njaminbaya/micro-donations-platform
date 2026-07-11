import { useContext, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import Blob from "../../components/Blob";

const Register = () => {
    const { register } = useContext(AuthContext);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const initialValues = { name: "", email: "", password: "", confirmPassword: "" };

    const validationSchema = Yup.object({
        name: Yup.string().min(2, "Too short!").required("Required"),
        email: Yup.string().email("Invalid email format").required("Required"),
        password: Yup.string().min(6, "Must be at least 6 characters").required("Required"),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref("password")], "Passwords must match")
            .required("Required"),
    });

    const handleSubmit = async (values) => {
        setError("");
        const { confirmPassword, ...userData } = values;
        const response = await register(userData);
        if (response.success) {
            navigate("/login");
        } else {
            setError(response.message);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-[calc(100vh-76px)] bg-brand-50 px-4 py-12 overflow-hidden">
            <Blob position="top-left" color="#CFEBE0" />
            <Blob position="bottom-right" color="#FBE7B8" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="card p-8 w-full max-w-md z-10"
            >
                <div className="text-center mb-7">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-3">
                        <UserPlus size={22} />
                    </span>
                    <h2 className="text-2xl font-display font-semibold text-ink-900">Create an account</h2>
                    <p className="text-ink-500 text-sm mt-1">Join us and support great causes.</p>
                </div>

                {error && <p className="text-danger-500 text-sm text-center mb-4 bg-danger-50 rounded-lg py-2">{error}</p>}

                <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
                    <Form className="space-y-4">
                        <div>
                            <div className="relative">
                                <UserPlus className="absolute top-3 left-3.5 text-ink-300" size={18} />
                                <Field name="name" placeholder="Your name" className="field pl-10" />
                            </div>
                            <ErrorMessage name="name" component="div" className="field-error" />
                        </div>

                        <div>
                            <div className="relative">
                                <Mail className="absolute top-3 left-3.5 text-ink-300" size={18} />
                                <Field name="email" type="email" placeholder="Email address" className="field pl-10" />
                            </div>
                            <ErrorMessage name="email" component="div" className="field-error" />
                        </div>

                        <div>
                            <div className="relative">
                                <Lock className="absolute top-3 left-3.5 text-ink-300" size={18} />
                                <Field name="password" type={showPassword ? "text" : "password"} placeholder="Password" className="field pl-10 pr-10" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-2.5 text-ink-300 hover:text-ink-500"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <ErrorMessage name="password" component="div" className="field-error" />
                        </div>

                        <div>
                            <div className="relative">
                                <Lock className="absolute top-3 left-3.5 text-ink-300" size={18} />
                                <Field name="confirmPassword" type="password" placeholder="Confirm password" className="field pl-10" />
                            </div>
                            <ErrorMessage name="confirmPassword" component="div" className="field-error" />
                        </div>

                        <button type="submit" className="btn-primary w-full mt-2">
                            Create account
                        </button>
                    </Form>
                </Formik>

                <p className="text-center text-sm text-ink-500 mt-6">
                    Already have an account?{" "}
                    <Link to="/login" className="text-brand-600 font-semibold hover:underline">Login here</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
