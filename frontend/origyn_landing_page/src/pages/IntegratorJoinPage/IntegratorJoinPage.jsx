import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import PageLayout from "@components/PageLayout";
import styles from "./IntegratorJoinPage.module.scss";

const API_URL = import.meta.env.VITE_INTEGRATOR_JOIN_API_URL || "";

export default function IntegratorJoinPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");
  const logoRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      vision: "",
      industryCategory: "",
      marketGeography: "",
      websiteSocialLinks: [""],
      presentationLinks: "",
      whyProjectExists: "",
      whyBecomeIntegrator: "",
      objectif01: "",
      objectif02: "",
      objectives: [],
      kpi01: "",
      kpi02: "",
      kpis: [],
      focusDetail: "",
      planImplement: "",
      roadmaps: "",
      team: "",
      riskFactors: "",
      optional: "",
    },
  });

  const websiteSocialLinks = watch("websiteSocialLinks") || [""];
  const objectives = watch("objectives") || [];
  const kpis = watch("kpis") || [];

  const setWebsiteSocialLinks = (v) =>
    setValue("websiteSocialLinks", v, { shouldValidate: true });
  const setObjectives = (v) =>
    setValue("objectives", v, { shouldValidate: true });
  const setKpis = (v) => setValue("kpis", v, { shouldValidate: true });

  const addWebsiteSocialLink = () =>
    setWebsiteSocialLinks([...websiteSocialLinks, ""]);
  const addObjective = () => setObjectives([...objectives, ""]);
  const addKpi = () => setKpis([...kpis, ""]);

  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [drag, setDrag] = useState(false);

  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File size must not exceed 1 MB");
      setUploadLabel("");
      setUploadPreview(null);
      if (logoRef.current) logoRef.current.value = "";
      return;
    }
    setUploadError("");
    setUploadLabel(file.name);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setUploadPreview(url);
    } else {
      setUploadPreview(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      if (logoRef.current) logoRef.current.files = e.dataTransfer.files;
      handleFile(f);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDrag(true);
  };
  const onDragLeave = () => setDrag(false);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onSubmit = async (data) => {
    setStatus("submitting");
    setSubmitError("");

    let logoBase64 = null;
    let logoName = null;
    let logoType = null;
    const file = logoRef.current?.files?.[0];
    if (file) {
      logoBase64 = await fileToBase64(file);
      logoName = file.name;
      logoType = file.type;
    }

    const payload = {
      ...data,
      websiteSocialLinks,
      objectives,
      kpis,
      logoBase64,
      logoName,
      logoType,
    };
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText);
      setStatus("success");
    } catch (err) {
      console.error(err.message || "Unexpected error.");
      setSubmitError("Send form error.");
      setStatus("error");
    }
  };

  const required = (msg) => ({ required: msg });

  if (status === "success") {
    return (
      <div className={styles.page}>
        <PageLayout>
          <div className={styles.content}>
            <div className={styles.statePanel}>
              <h1 className={styles.title}>
                <span className={styles.titleItalic}>Thank you</span>
              </h1>
              <p className={styles.stateMessage}>We will get back to you</p>
              <button
                type="button"
                className={styles.sendBtn}
                style={{ marginTop: 24 }}
                onClick={() => navigate("/integrator")}
              >
                BACK TO INTEGRATOR PAGE
              </button>
            </div>
          </div>
        </PageLayout>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.page}>
        <PageLayout>
          <div className={styles.content}>
            <div className={styles.statePanel}>
              <h1 className={styles.title}>
                <span className={styles.titleItalic}>Something went wrong</span>
              </h1>
              <p className={styles.stateMessage}>
                {submitError || "Please try again or come back later"}
              </p>
              <div className={styles.stateBtns}>
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={() => {
                    setStatus("idle");
                    setSubmitError("");
                  }}
                >
                  RETRY
                </button>
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={() => navigate("/integrator")}
                >
                  BACK TO INTEGRATOR PAGE
                </button>
              </div>
            </div>
          </div>
        </PageLayout>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageLayout>
      <div className={`${styles.content} mx-auto px-4 pt-24 xl:pt-40 pb-24`}>
        <div>
          <h1 className={styles.title}>
            Integrators Program
            <span className={styles.titleItalic}>Application Form</span>
          </h1>
        </div>
        <div className={styles.formWrapper}>
          <div className={styles.formTop}>
            <p className={styles.requiredLabel}>REQUIRED *</p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  INTEGRATOR REPRESENTATIVE
                </div>
                <input
                  className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                  placeholder="FULL NAME *"
                  {...register("fullName", required("Required"))}
                />
                {errors.fullName && (
                  <p className={styles.errorText}>{errors.fullName.message}</p>
                )}
                <input
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  placeholder="EMAIL ADDRESS *"
                  type="email"
                  {...register("email", {
                    required: "Required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Please enter a valid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className={styles.errorText}>{errors.email.message}</p>
                )}
                <input
                  className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                  placeholder="PHONE NUMBER *"
                  {...register("phone", required("Required"))}
                />
                {errors.phone && (
                  <p className={styles.errorText}>{errors.phone.message}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>OVERVIEW</div>
                <div className={styles.sectionDesc}>
                  PLEASE WRITE A BRIEF OVERVIEW OF THE INTEGRATOR PROJECT,
                  INCLUDING
                </div>
                <input
                  className={`${styles.input} ${errors.vision ? styles.inputError : ""}`}
                  placeholder="The vision of your Integrator in a sentence... *"
                  {...register("vision", required("Required"))}
                />
                {errors.vision && (
                  <p className={styles.errorText}>{errors.vision.message}</p>
                )}
                <input
                  className={`${styles.input} ${errors.industryCategory ? styles.inputError : ""}`}
                  placeholder="Industry category examples (art, music, luxury) or Specific assets (gold, diamonds) *"
                  {...register("industryCategory", required("Required"))}
                />
                {errors.industryCategory && (
                  <p className={styles.errorText}>
                    {errors.industryCategory.message}
                  </p>
                )}
                <input
                  className={`${styles.input} ${errors.marketGeography ? styles.inputError : ""}`}
                  placeholder="Market Geography (Global, Europe, Country specific) *"
                  {...register("marketGeography", required("Required"))}
                />
                {errors.marketGeography && (
                  <p className={styles.errorText}>
                    {errors.marketGeography.message}
                  </p>
                )}
                {websiteSocialLinks.map((_, i) => (
                  <input
                    key={i}
                    className={`${styles.input} ${i === 0 && errors.websiteSocialLinks ? styles.inputError : ""}`}
                    placeholder={
                      i === 0
                        ? "Website and Social Media links *"
                        : "Website and Social Media links"
                    }
                    {...register(
                      `websiteSocialLinks.${i}`,
                      i === 0 ? required("Required") : {},
                    )}
                  />
                ))}
                {websiteSocialLinks.length === 1 &&
                  errors.websiteSocialLinks && (
                    <p className={styles.errorText}>
                      {errors.websiteSocialLinks.message}
                    </p>
                  )}
                <div className={styles.addBtnWrap}>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={addWebsiteSocialLink}
                  >
                    <img
                      src="/more_ic.svg"
                      alt=""
                      className={styles.addBtnIcon}
                    />
                    ADD A LINK
                  </button>
                </div>
                <input
                  className={styles.input}
                  placeholder="Link to project presentation (not mandatory, but helpful)"
                  {...register("presentationLinks")}
                />
                <div
                  className={`${styles.uploadZone} ${drag ? styles.dragging : ""}`}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onClick={() => logoRef.current?.click()}
                >
                  <input
                    ref={logoRef}
                    type="file"
                    accept=".jpeg,.jpg,.png,.svg,.pdf"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  {uploadPreview ? (
                    <img
                      src={uploadPreview}
                      alt="Logo preview"
                      className={styles.uploadPreview}
                    />
                  ) : (
                    <img
                      src="/more_ic.svg"
                      alt=""
                      className={styles.uploadIcon}
                    />
                  )}
                  <div className={styles.uploadLabel}>
                    {uploadLabel || (
                      <>
                        <span className={styles.uploadHighlight}>Upload</span>
                        <span>{" your logo or drag it here (OPTIONAL)"}</span>
                      </>
                    )}
                  </div>
                  <div className={styles.uploadHint}>
                    JPEG, PNG, SVG, PDF — 1 MB max
                  </div>
                </div>
                {uploadError && (
                  <p className={styles.errorText}>{uploadError}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>ACQUISITION</div>
                <div className={styles.sectionDesc}>
                  CLEARLY DEFINE YOUR TARGET AUDIENCE AND HOW YOU ACQUIRE THEM
                  OR WILL ACQUIRE THEM
                </div>
                <input
                  className={`${styles.input} ${errors.whyProjectExists ? styles.inputError : ""}`}
                  placeholder="Why does this project need to exist, and how is it different? *"
                  {...register("whyProjectExists", required("Required"))}
                />
                {errors.whyProjectExists && (
                  <p className={styles.errorText}>
                    {errors.whyProjectExists.message}
                  </p>
                )}
                <input
                  className={`${styles.input} ${errors.whyBecomeIntegrator ? styles.inputError : ""}`}
                  placeholder="Why is it important to you to become an Integrator? *"
                  {...register("whyBecomeIntegrator", required("Required"))}
                />
                {errors.whyBecomeIntegrator && (
                  <p className={styles.errorText}>
                    {errors.whyBecomeIntegrator.message}
                  </p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  KEY OBJECTIVES THAT YOU WANT TO ACHIEVE
                </div>
                <input
                  className={`${styles.input} ${errors.objectif01 ? styles.inputError : ""}`}
                  placeholder="Objectif 01 *"
                  {...register("objectif01", required("Required"))}
                />
                {errors.objectif01 && (
                  <p className={styles.errorText}>
                    {errors.objectif01.message}
                  </p>
                )}
                <input
                  className={styles.input}
                  placeholder="Objectif 02"
                  {...register("objectif02")}
                />
                {objectives.map((_, i) => (
                  <input
                    key={i}
                    className={styles.input}
                    placeholder={`Objectif ${String(i + 3).padStart(2, "0")}`}
                    {...register(`objectives.${i}`)}
                  />
                ))}
                <div className={styles.addBtnWrap}>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={addObjective}
                  >
                    <img
                      src="/more_ic.svg"
                      alt=""
                      className={styles.addBtnIcon}
                    />
                    ADD A OBJECTIVE
                  </button>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  KEY METRICS YOU WANT TO MONITOR
                </div>
                <input
                  className={`${styles.input} ${errors.kpi01 ? styles.inputError : ""}`}
                  placeholder="KPI 01 *"
                  {...register("kpi01", required("Required"))}
                />
                {errors.kpi01 && (
                  <p className={styles.errorText}>{errors.kpi01.message}</p>
                )}
                <input
                  className={styles.input}
                  placeholder="KPI 02"
                  {...register("kpi02")}
                />
                {kpis.map((_, i) => (
                  <input
                    key={i}
                    className={styles.input}
                    placeholder={`KPI ${String(i + 3).padStart(2, "0")}`}
                    {...register(`kpis.${i}`)}
                  />
                ))}
                <div className={styles.addBtnWrap}>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={addKpi}
                  >
                    <img
                      src="/more_ic.svg"
                      alt=""
                      className={styles.addBtnIcon}
                    />
                    ADD A KPI
                  </button>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  WHAT AND HOW WILL YOU DO
                </div>
                <textarea
                  className={styles.textarea}
                  placeholder="Tell us in detail what you will focus on as an Integrator and how the success of this project looks like."
                  {...register("focusDetail")}
                />
                <textarea
                  className={styles.textarea}
                  placeholder="Tell us how you plan to implement this project"
                  {...register("planImplement")}
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  FIRST 3 MONTH AND 3 YEARS ROADMAPS
                </div>
                <div className={styles.sectionDesc}>
                  You must indicate when you expect to start minting and an
                  estimated number of certificates *
                </div>
                <textarea
                  className={`${styles.textarea} ${errors.roadmaps ? styles.inputError : ""}`}
                  placeholder=""
                  {...register("roadmaps", required("Required"))}
                />
                {errors.roadmaps && (
                  <p className={styles.errorText}>{errors.roadmaps.message}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>TEAM</div>

                <textarea
                  className={`${styles.textarea} ${errors.team ? styles.inputError : ""}`}
                  placeholder="Tell us about your current team, if any, or future team roles that you may require, along with links to LinkedIn *"
                  {...register("team", required("Required"))}
                />
                {errors.team && (
                  <p className={styles.errorText}>{errors.team.message}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>RISK FACTORS</div>

                <textarea
                  className={styles.textarea}
                  placeholder="Tell us the reasons and factors which will lead to failure."
                  {...register("riskFactors")}
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>OPTIONAL</div>

                <textarea
                  className={styles.textarea}
                  placeholder="Anything else you want to share that will increase your chances of selection?"
                  {...register("optional")}
                />
              </div>

              <div className={styles.sendWrap}>
                <button
                  type="submit"
                  className={styles.sendBtn}
                  disabled={!isValid || status === "submitting"}
                >
                  {status === "submitting" ? "Envoi…" : "SEND"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      </PageLayout>
    </div>
  );
}
