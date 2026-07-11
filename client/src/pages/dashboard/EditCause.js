import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import CauseService from "../../services/CauseService";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import Card from "../../components/ui/Card";
import PageLoader from "../../components/ui/PageLoader";

const EditCause = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [cause, setCause] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchCause = async () => {
            try {
                const data = await CauseService.getCauseById(id);
                if (isMounted) setCause(data);
            } catch (err) {
                if (isMounted) setError("Failed to fetch cause details.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchCause();
        return () => { isMounted = false; };
    }, [id]);

    const validationSchema = Yup.object({
        title: Yup.string().required("Title is required"),
        description: Yup.string().required("Description is required"),
        goal_amount: Yup.number().min(1, "Goal must be at least $1").required("Funding goal is required"),
    });

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            await CauseService.updateCause(id, values);
            toast.success("Cause updated.");
            navigate(`/causes/${id}`);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update cause.");
        }
        setSubmitting(false);
    };

    if (loading) return <PageLoader label="Loading cause…" minHeight="40vh" />;

    if (error && !cause) {
        return <p className="text-danger-500 text-center mt-5">{error}</p>;
    }

    if (!cause) return null;

    if (!user || (cause.user_id !== user.id && user.role !== "admin")) {
        return <p className="text-center mt-5 text-ink-500">You are not authorized to edit this cause.</p>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Edit Cause</h1>
            {error && <p className="text-danger-500 mb-4 bg-danger-50 rounded-lg py-2 px-3 text-sm">{error}</p>}
            <Formik
                initialValues={{ title: cause.title, description: cause.description, goal_amount: cause.goal_amount }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Card className="p-6 space-y-5">
                            <div>
                                <label className="field-label">Title</label>
                                <Field type="text" name="title" className="field" />
                                <ErrorMessage name="title" component="div" className="field-error" />
                            </div>

                            <div>
                                <label className="field-label">Description</label>
                                <Field as="textarea" name="description" rows="4" className="field" />
                                <ErrorMessage name="description" component="div" className="field-error" />
                            </div>

                            <div>
                                <label className="field-label">Funding Goal ($)</label>
                                <Field type="number" name="goal_amount" className="field" />
                                <ErrorMessage name="goal_amount" component="div" className="field-error" />
                            </div>

                            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                                {isSubmitting ? "Updating…" : "Update Cause"}
                            </button>
                        </Card>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default EditCause;
