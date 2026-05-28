import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import PageLayout from "@components/PageLayout";
import { useLocale, useT } from "@/i18n/LocaleContext";
import { localePath } from "@/i18n/paths";
import styles from "./IntegratorJoinPage.module.scss";

const API_URL = import.meta.env.VITE_INTEGRATOR_JOIN_API_URL || "";

export default function IntegratorJoinPage() {
  const navigate = useNavigate();
  const t = useT();
  const { locale } = useLocale();
  const backToIntegrator = localePath(locale, "integrator");
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
      setUploadError(t("integratorJoin.fileSizeError"));
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
      setSubmitError(t("integratorJoin.errorSend"));
      setStatus("error");
    }
  };

  const required = () => ({ required: t("integratorJoin.requiredMessage") });
  const objectiveTemplate = t("integratorJoin.sections.objectives.more");
  const kpiTemplate = t("integratorJoin.sections.kpis.more");

  if (status === "success") {
    return (
      <div className={styles.page}>
        <PageLayout>
          <div className={styles.content}>
            <div className={styles.statePanel}>
              <h1 className={styles.title}>
                <span className={styles.titleItalic}>
                  {t("integratorJoin.successTitle")}
                </span>
              </h1>
              <p className={styles.stateMessage}>
                {t("integratorJoin.successMessage")}
              </p>
              <button
                type="button"
                className={styles.sendBtn}
                style={{ marginTop: 24 }}
                onClick={() => navigate(backToIntegrator)}
              >
                {t("integratorJoin.backToIntegrator")}
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
                <span className={styles.titleItalic}>
                  {t("integratorJoin.errorTitle")}
                </span>
              </h1>
              <p className={styles.stateMessage}>
                {submitError || t("integratorJoin.errorMessageDefault")}
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
                  {t("integratorJoin.retry")}
                </button>
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={() => navigate(backToIntegrator)}
                >
                  {t("integratorJoin.backToIntegrator")}
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
            {t("integratorJoin.title")}
            <span className={styles.titleItalic}>
              {t("integratorJoin.titleItalic")}
            </span>
          </h1>
        </div>
        <div className={styles.formWrapper}>
          <div className={styles.formTop}>
            <p className={styles.requiredLabel}>{t("integratorJoin.requiredLabel")}</p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  {t("integratorJoin.sections.representative.title")}
                </div>
                <input
                  className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                  placeholder={t("integratorJoin.sections.representative.fullName")}
                  {...register("fullName", required())}
                />
                {errors.fullName && (
                  <p className={styles.errorText}>{errors.fullName.message}</p>
                )}
                <input
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  placeholder={t("integratorJoin.sections.representative.email")}
                  type="email"
                  {...register("email", {
                    required: t("integratorJoin.requiredMessage"),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t("integratorJoin.emailInvalid"),
                    },
                  })}
                />
                {errors.email && (
                  <p className={styles.errorText}>{errors.email.message}</p>
                )}
                <input
                  className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                  placeholder={t("integratorJoin.sections.representative.phone")}
                  {...register("phone", required())}
                />
                {errors.phone && (
                  <p className={styles.errorText}>{errors.phone.message}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  {t("integratorJoin.sections.overview.title")}
                </div>
                <div className={styles.sectionDesc}>
                  {t("integratorJoin.sections.overview.description")}
                </div>
                <input
                  className={`${styles.input} ${errors.vision ? styles.inputError : ""}`}
                  placeholder={t("integratorJoin.sections.overview.vision")}
                  {...register("vision", required())}
                />
                {errors.vision && (
                  <p className={styles.errorText}>{errors.vision.message}</p>
                )}
                <input
                  className={`${styles.input} ${errors.industryCategory ? styles.inputError : ""}`}
                  placeholder={t("integratorJoin.sections.overview.industry")}
                  {...register("industryCategory", required())}
                />
                {errors.industryCategory && (
                  <p className={styles.errorText}>
                    {errors.industryCategory.message}
                  </p>
                )}
                <input
                  className={`${styles.input} ${errors.marketGeography ? styles.inputError : ""}`}
                  placeholder={t("integratorJoin.sections.overview.geography")}
                  {...register("marketGeography", required())}
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
                        ? t("integratorJoin.sections.overview.socialFirst")
                        : t("integratorJoin.sections.overview.social")
                    }
                    {...register(
                      `websiteSocialLinks.${i}`,
                      i === 0 ? required() : {},
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
                    {t("integratorJoin.addLink")}
                  </button>
                </div>
                <input
                  className={styles.input}
                  placeholder={t("integratorJoin.sections.overview.presentation")}
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
                      alt={t("integratorJoin.logoPreviewAlt")}
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
                        <span className={styles.uploadHighlight}>
                          {t("integratorJoin.uploadHighlight")}
                        </span>
                        <span>{t("integratorJoin.uploadSuffix")}</span>
                      </>
                    )}
                  </div>
                  <div className={styles.uploadHint}>
                    {t("integratorJoin.uploadHint")}
                  </div>
                </div>
                {uploadError && (
                  <p className={styles.errorText}>{uploadError}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  {t("integratorJoin.sections.acquisition.title")}
                </div>
                <div className={styles.sectionDesc}>
                  {t("integratorJoin.sections.acquisition.description")}
                </div>
                <input
                  className={`${styles.input} ${errors.whyProjectExists ? styles.inputError : ""}`}
                  placeholder={t("integratorJoin.sections.acquisition.whyExists")}
                  {...register("whyProjectExists", required())}
                />
                {errors.whyProjectExists && (
                  <p className={styles.errorText}>
                    {errors.whyProjectExists.message}
                  </p>
                )}
                <input
                  className={`${styles.input} ${errors.whyBecomeIntegrator ? styles.inputError : ""}`}
                  placeholder={t("integratorJoin.sections.acquisition.whyIntegrator")}
                  {...register("whyBecomeIntegrator", required())}
                />
                {errors.whyBecomeIntegrator && (
                  <p className={styles.errorText}>
                    {errors.whyBecomeIntegrator.message}
                  </p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  {t("integratorJoin.sections.objectives.title")}
                </div>
                <input
                  className={`${styles.input} ${errors.objectif01 ? styles.inputError : ""}`}
                  placeholder={t("integratorJoin.sections.objectives.first")}
                  {...register("objectif01", required())}
                />
                {errors.objectif01 && (
                  <p className={styles.errorText}>
                    {errors.objectif01.message}
                  </p>
                )}
                <input
                  className={styles.input}
                  placeholder={t("integratorJoin.sections.objectives.second")}
                  {...register("objectif02")}
                />
                {objectives.map((_, i) => (
                  <input
                    key={i}
                    className={styles.input}
                    placeholder={objectiveTemplate.replace(
                      "{n}",
                      String(i + 3).padStart(2, "0"),
                    )}
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
                    {t("integratorJoin.addObjective")}
                  </button>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  {t("integratorJoin.sections.kpis.title")}
                </div>
                <input
                  className={`${styles.input} ${errors.kpi01 ? styles.inputError : ""}`}
                  placeholder={t("integratorJoin.sections.kpis.first")}
                  {...register("kpi01", required())}
                />
                {errors.kpi01 && (
                  <p className={styles.errorText}>{errors.kpi01.message}</p>
                )}
                <input
                  className={styles.input}
                  placeholder={t("integratorJoin.sections.kpis.second")}
                  {...register("kpi02")}
                />
                {kpis.map((_, i) => (
                  <input
                    key={i}
                    className={styles.input}
                    placeholder={kpiTemplate.replace(
                      "{n}",
                      String(i + 3).padStart(2, "0"),
                    )}
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
                    {t("integratorJoin.addKpi")}
                  </button>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  {t("integratorJoin.sections.plan.title")}
                </div>
                <textarea
                  className={styles.textarea}
                  placeholder={t("integratorJoin.sections.plan.focus")}
                  {...register("focusDetail")}
                />
                <textarea
                  className={styles.textarea}
                  placeholder={t("integratorJoin.sections.plan.implement")}
                  {...register("planImplement")}
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  {t("integratorJoin.sections.roadmaps.title")}
                </div>
                <div className={styles.sectionDesc}>
                  {t("integratorJoin.sections.roadmaps.description")}
                </div>
                <textarea
                  className={`${styles.textarea} ${errors.roadmaps ? styles.inputError : ""}`}
                  placeholder=""
                  {...register("roadmaps", required())}
                />
                {errors.roadmaps && (
                  <p className={styles.errorText}>{errors.roadmaps.message}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  {t("integratorJoin.sections.team.title")}
                </div>

                <textarea
                  className={`${styles.textarea} ${errors.team ? styles.inputError : ""}`}
                  placeholder={t("integratorJoin.sections.team.placeholder")}
                  {...register("team", required())}
                />
                {errors.team && (
                  <p className={styles.errorText}>{errors.team.message}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  {t("integratorJoin.sections.risk.title")}
                </div>

                <textarea
                  className={styles.textarea}
                  placeholder={t("integratorJoin.sections.risk.placeholder")}
                  {...register("riskFactors")}
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sectionTitle}>
                  {t("integratorJoin.sections.optional.title")}
                </div>

                <textarea
                  className={styles.textarea}
                  placeholder={t("integratorJoin.sections.optional.placeholder")}
                  {...register("optional")}
                />
              </div>

              <div className={styles.sendWrap}>
                <button
                  type="submit"
                  className={styles.sendBtn}
                  disabled={!isValid || status === "submitting"}
                >
                  {status === "submitting"
                    ? t("integratorJoin.sending")
                    : t("integratorJoin.send")}
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
