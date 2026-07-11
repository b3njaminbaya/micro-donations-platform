import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import CauseService from "../../services/CauseService";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "react-toastify";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const CATEGORIES = ["Health", "Education", "Environment", "Water", "Emergency", "Community", "Other"];

const CreateCause = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const data = await CauseService.uploadImage(file);
      setImageUrl(data.image_url);
    } catch (err) {
      setError(err.response?.data?.error || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const validationSchema = Yup.object({
    title: Yup.string().required("Title is required"),
    description: Yup.string().required("Description is required"),
    goal_amount: Yup.number().min(1, "Goal must be at least $1").required("Funding goal is required"),
    category: Yup.string().required("Category is required"),
    country: Yup.string().required("Country is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setError(null);
    try {
      await CauseService.createCause({ ...values, image_url: imageUrl });
      toast.success("Cause created successfully!");
      navigate("/my-causes");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create cause");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-display font-semibold text-ink-900 mb-3">Create a Cause</h2>
        <p className="text-ink-500 mb-6">You need an account to start a cause.</p>
        <div className="flex justify-center gap-3">
          <Button to="/register" variant="primary">Register</Button>
          <Button to="/login" variant="secondary">Login</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <h1 className="text-2xl font-display font-semibold text-ink-900 mb-6">Create a New Cause</h1>

      {error && <p className="text-danger-500 mb-4 bg-danger-50 rounded-lg py-2 px-3 text-sm">{error}</p>}

      <Formik
        initialValues={{ title: "", description: "", goal_amount: "", category: "", country: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form>
            <Card className="p-6 space-y-5">
              <div>
                <label className="field-label">Title</label>
                <Field name="title" type="text" className="field" />
                <ErrorMessage name="title" component="div" className="field-error" />
              </div>

              <div>
                <label className="field-label">Description</label>
                <Field as="textarea" name="description" rows="4" className="field" />
                <ErrorMessage name="description" component="div" className="field-error" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="field-label">Funding Goal ($)</label>
                  <Field name="goal_amount" type="number" className="field" />
                  <ErrorMessage name="goal_amount" component="div" className="field-error" />
                </div>

                <div>
                  <label className="field-label">Category</label>
                  <Field as="select" name="category" className="field">
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Field>
                  <ErrorMessage name="category" component="div" className="field-error" />
                </div>
              </div>

              <div>
                <label className="field-label">Country</label>
                <Field name="country" type="text" placeholder="e.g., Kenya" className="field" />
                <ErrorMessage name="country" component="div" className="field-error" />
              </div>

              <div>
                <label className="field-label">Cover Image</label>
                <div className="flex items-center gap-3 border border-dashed border-line rounded-lg px-4 py-3">
                  <ImageIcon className="text-ink-300 shrink-0" size={20} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="w-full text-sm text-ink-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold" />
                </div>
                {uploading && <p className="text-sm text-ink-500 mt-2">Uploading…</p>}
                {imageUrl && (
                  <motion.img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover mt-3 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </div>

              <button type="submit" disabled={isSubmitting || uploading} className="btn-primary w-full">
                <Plus size={16} />
                {isSubmitting ? "Creating…" : "Create Cause"}
              </button>
            </Card>
          </Form>
        )}
      </Formik>
    </motion.div>
  );
};

export default CreateCause;
