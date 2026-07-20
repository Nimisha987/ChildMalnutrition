# # from flask import Flask, request,jsonify
# # from flask_cors import CORS
# # import joblib, json
# # import numpy as np
# # import pandas as pd

# # app = Flask(__name__)

# # CORS(app)

# # models= joblib.load('tabular_models.pkl')
# # with open ('model_features.json') as f:
# #     info=json.load(f)

# # FEATURE_COLS  = info['features']
# # TARGET_COLS = ['stunted','wasted','underweight']

# # MEDIANS = {
# #     'child_age_months':24,
# #     'gender':1,
# #     'birth_Weight':3,
# #     'weight_kg':110,
# #     'height_cm':850,
# #     'child_bmi_raw':1.5,
# #     'breastfeeding':24,
# #     'diarrhea':0,
# #     'fever':0,
# #     'cough':0,
# #     'mother_age':27,
# #     'mother_education':2,
# #     'mother_bmi':2200,
# #     'children_ever_born':2,
# #     'birth_order':2,
# #     'household_members':5,
# #     'urban_rural':2,
# #     'wealth_index':2,
# #     'water_source':12,
# #     'time_to_water':0,
# #     'sanitation_toilet_facility':44,
# #     'handwashing_facility':1,
# #     'antenatal_visits':4
# # }


# # @app.route('/predict',methods = ['POST'])
# # def predict():
# #     data = request.json 
# #     row = {col: float(data.get(col,MEDIANS.get(col,0)))
# #            for col in FEATURE_COLS}
# #     df = pd.DataFrame([row][FEATURE_COLS])

# #     results = {}

# #     for t in TARGET_COLS:
# #         prob = float(models[t].predict_proba(df)[0][1])
# #         results[t]={
# #             'probability':round(prob*100,1),
# #             'at_risk':prob>0.5
# #         }
# #         return jsonify({
# #             'results':results,
# #             'any_risk':any(r['at_risk'] for r in results.values())

# #         })
    
# # @app.route('/health',methods =['GET'])
# # def health():
# #     return jsonify({'status':'ok'})

# # if __name__=='__main__':
# #     app.run(debug=True,port=5000)
    
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import joblib, json
# import numpy as np
# from io import BytesIO
# import pandas as pd
# import tensorflow as tf
# from tensorflow.keras.applications import MobileNetV2
# from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
# from tensorflow.keras.preprocessing import image as keras_image

# app = Flask(__name__)
# CORS(app)

# # ── Load BOTH models ──────────────────────────────────────
# tabular_models      = joblib.load('tabular_models.pkl')
# fusion_models       = joblib.load('early_fusion_models.pkl')

# # ── Load feature info ─────────────────────────────────────
# with open('feature_info.json') as f:
#     info = json.load(f)

# FEATURE_COLS = info['tabular_features']
# TARGET_COLS  = ['stunted', 'wasted', 'underweight']

# # ── Load MobileNetV2 for image embedding ──────────────────
# print("Loading MobileNetV2...")
# extractor = MobileNetV2(
#     weights='imagenet',
#     include_top=False,
#     pooling='avg',
#     input_shape=(224, 224, 3)
# )
# extractor.trainable = False
# print("✅ MobileNetV2 ready!")

# # ── Default medians (missing values fill karne ke liye) ───
# MEDIANS = {
#     'child_age_months': 24, 'gender': 1, 'birth_weight': 3,
#     'weight_kg': 110, 'height_cm': 850, 'child_bmi_raw': 1.5,
#     'breastfeeding': 24, 'diarrhea': 0, 'fever': 0, 'cough': 0,
#     'mother_age': 27, 'mother_education': 2, 'mother_bmi': 2200,
#     'children_ever_born': 2, 'birth_order': 2, 'household_members': 5,
#     'urban_rural': 2, 'wealth_index': 2, 'water_source': 12,
#     'time_to_water': 0, 'sanitation_toilet_facility': 44,
#     'handwashing_facility': 1, 'antenatal_visits': 4
# }

# # ── Helper: tabular row banao ─────────────────────────────
# def make_tabular_row(data):
#     row = {col: float(data.get(col, MEDIANS.get(col, 0)))
#            for col in FEATURE_COLS}
#     return pd.DataFrame([row])[FEATURE_COLS]

# # ── Helper: image embedding nikalo ───────────────────────
# # def get_image_embedding(img_file):
# #     img     = keras_image.load_img(img_file, target_size=(224, 224))
# #     arr     = keras_image.img_to_array(img)
# #     arr     = np.expand_dims(arr, axis=0)
# #     arr     = preprocess_input(arr)
# #     return extractor.predict(arr, verbose=0)[0]  # (1280,)
# from io import BytesIO

# def get_image_embedding(img_file):
#     print("Function called")
#     print(type(img_file))

#     img_file.stream.seek(0)

#     img = keras_image.load_img(
#         BytesIO(img_file.read()),
#         target_size=(224, 224)
#     )

#     print("Image loaded successfully")

#     arr = keras_image.img_to_array(img)
#     arr = np.expand_dims(arr, axis=0)
#     arr = preprocess_input(arr)

#     embedding = extractor.predict(arr, verbose=0)

#     print("Embedding shape:", embedding.shape)

#     return embedding[0]
# # ── Helper: predictions format karo ──────────────────────
# def format_predictions(models, X):
#     results  = {}
#     any_risk = False
#     for t in TARGET_COLS:
#         prob    = float(models[t].predict_proba(X)[0][1])
#         at_risk = prob > 0.5
#         if at_risk:
#             any_risk = True
#         results[t] = {
#             'probability': round(prob * 100, 1),
#             'at_risk':     at_risk
#         }
#     return results, any_risk

# # ─────────────────────────────────────────────────────────
# # ENDPOINT 1: Detailed Form → Tabular Only
# # ─────────────────────────────────────────────────────────
# @app.route('/predict', methods=['POST'])
# def predict_tabular():
#     """
#     Detailed Form tab se aata hai
#     Sirf tabular_models.pkl use karta hai
#     """
#     data    = request.json
#     df      = make_tabular_row(data)
#     results, any_risk = format_predictions(tabular_models, df)

#     return jsonify({
#         'results':  results,
#         'any_risk': any_risk,
#         'mode':     'tabular'
#     })

# # ─────────────────────────────────────────────────────────
# # ENDPOINT 2: Quick Scan → Image + Early Fusion
# # ─────────────────────────────────────────────────────────
# @app.route('/predict-image', methods=['POST'])
# def predict_image():
#     """
#     Quick Scan tab se aata hai
#     early_fusion_models.pkl use karta hai
#     Image embedding + tabular features combine karta hai
#     """
#     # Image file lo
#     if 'image' not in request.files:
#         return jsonify({'error': 'No image provided'}), 400

#     img_file = request.files['image']
#     age      = int(request.form.get('age',    18))
#     gender   = int(request.form.get('gender',  1))

#     # Image embedding nikalo
#     img_embedding = get_image_embedding(img_file)  # (1280,)

#     # Tabular row banao (age + gender + medians)
#     tab_data = {**MEDIANS, 'child_age_months': age, 'gender': gender}
#     df       = make_tabular_row(tab_data)

#     # Early Fusion: tabular + image combine karo
#     X_tab    = df.values                           # (1, 23)
#     X_img    = img_embedding.reshape(1, -1)        # (1, 1280)
#     X_fused  = np.hstack([X_tab, X_img])           # (1, 1303)

#     results, any_risk = format_predictions(fusion_models, X_fused)

#     return jsonify({
#         'results':  results,
#         'any_risk': any_risk,
#         'mode':     'early_fusion'
#     })

# # ─────────────────────────────────────────────────────────
# # ENDPOINT 3: Health check
# # ─────────────────────────────────────────────────────────
# @app.route('/health', methods=['GET'])
# def health():
#     return jsonify({
#         'status':  'ok',
#         'models':  ['tabular_models', 'early_fusion_models'],
#         'epsilon': info.get('epsilon', 1.0)
#     })

# if __name__ == '__main__':
#     app.run(debug=True, port=5000)
import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib, json
import numpy as np
from io import BytesIO
import pandas as pd
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing import image as keras_image
tf.config.threading.set_intra_op_parallelism_threads(1)
tf.config.threading.set_inter_op_parallelism_threads(1)
app = Flask(__name__)
CORS(app)



# tabular_models = joblib.load("tabular_models.pkl")
# print("Loaded successfully")

# ── Load tabular model (for Detailed Form tab) ────────────
tabular_models = joblib.load('tabular_models.pkl')

# ── Load feature info ─────────────────────────────────────
with open('features.json') as f:
    info = json.load(f)

FEATURE_COLS = info['tabular_features']
TARGET_COLS  = ['stunted', 'wasted', 'underweight']

# ── Load YOUR TRAINED CNN (for Quick Scan tab) ────────────
# print("Loading trained CNN model...")
# cnn_classifier = tf.keras.models.load_model('cnn_malnutrition_model.keras')
# print(" CNN model ready!")
cnn_classifier = None
# Must match train_gen.class_indices printed during training in the notebook
CLASS_INDICES = {'malnourished': 0, 'normal': 1}

# ── Default medians (Detailed Form ke missing values ke liye) ──
MEDIANS = {
    'child_age_months': 24, 'gender': 1, 'birth_weight': 3,
    'weight_kg': 110, 'height_cm': 850, 'child_bmi_raw': 1.5,
    'breastfeeding': 24, 'diarrhea': 0, 'fever': 0, 'cough': 0,
    'mother_age': 27, 'mother_education': 2, 'mother_bmi': 2200,
    'children_ever_born': 2, 'birth_order': 2, 'household_members': 5,
    'urban_rural': 2, 'wealth_index': 2, 'water_source': 12,
    'time_to_water': 0, 'sanitation_toilet_facility': 44,
    'handwashing_facility': 1, 'antenatal_visits': 4
}

# ── Helper: tabular row banao (Detailed Form ke liye) ─────
def make_tabular_row(data):
    row = {col: float(data.get(col, MEDIANS.get(col, 0)))
           for col in FEATURE_COLS}
    return pd.DataFrame([row])[FEATURE_COLS]
def get_cnn_model():
    global cnn_classifier
    if cnn_classifier is None:
        print("Loading CNN model (first request)...")
        cnn_classifier = tf.keras.models.load_model('cnn_malnutrition_model.keras')
        print("CNN model ready!")
    return cnn_classifier

# ── Helper: CNN se image predict karo ─────────────────────
def predict_from_image(img_file):
    # print("A")
    img_file.stream.seek(0)
    # print("B")
    img = keras_image.load_img(
        BytesIO(img_file.read()),
        target_size=(224, 224)
    )
    # print("C")
    arr = keras_image.img_to_array(img)
    # print("D")
    arr = np.expand_dims(arr, axis=0)
    arr = preprocess_input(arr)
    # print("E")
    # pred = cnn_classifier.predict(arr, verbose=0)[0]  # [prob_malnourished, prob_normal]
    model = get_cnn_model()
    pred = model.predict(arr, verbose=0)[0]
    # print("F")
    prob_malnourished = float(pred[CLASS_INDICES['malnourished']])
    # print("G")
    return prob_malnourished

# ── Helper: tabular model predictions format karo ─────────
def format_tabular_predictions(models, X):
    results  = {}
    any_risk = False
    for t in TARGET_COLS:
        prob    = float(models[t].predict_proba(X)[0][1])
        at_risk = prob > 0.5
        if at_risk:
            any_risk = True
        results[t] = {
            'probability': round(prob * 100, 1),
            'at_risk':     at_risk
        }
    return results, any_risk

# ─────────────────────────────────────────────────────────
# ENDPOINT 1: Detailed Form → Tabular Only (unchanged)
# ─────────────────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict_tabular():
    data = request.json
    df   = make_tabular_row(data)
    results, any_risk = format_tabular_predictions(tabular_models, df)

    return jsonify({
        'results':  results,
        'any_risk': any_risk,
        'mode':     'tabular'
    })

# ─────────────────────────────────────────────────────────
# ENDPOINT 2: Quick Scan → CNN Image Model (FIXED)
# ─────────────────────────────────────────────────────────
@app.route('/predict-image', methods=['POST'])
def predict_image():
    """
    Quick Scan tab se aata hai.
    Ab sirf trained CNN use karta hai — age/gender sirf
    display/context ke liye, model ko nahi jaate.
    Isliye photo actually result badalta hai.
    """
   
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    print("STEP 1: Request received")
    img_file = request.files['image']
    print("STEP 2: Image received")
    prob_malnourished = predict_from_image(img_file)
    at_risk = prob_malnourished > 0.5

    # NOTE: CNN abhi ek overall malnutrition risk deta hai,
    # 3 alag indicators (stunted/wasted/underweight) nahi.
    # Jab tak CNN ko 3-output wala nahi banate, teeno cards
    # ke liye wahi overall probability use kar rahe hain.
    results = {
        t: {
            'probability': round(prob_malnourished * 100, 1),
            'at_risk':     at_risk
        }
        
        for t in TARGET_COLS
    }
    print("STEP 3: Prediction finished")

    return jsonify({
        'results':  results,
        'any_risk': at_risk,
        'mode':     'cnn_image'
    })
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "MalnutriScan Backend is running",
        "status": "success"
    })

# ─────────────────────────────────────────────────────────
# ENDPOINT 3: Health check
# ─────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'models': ['tabular_models', 'cnn_classifier'],
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)


