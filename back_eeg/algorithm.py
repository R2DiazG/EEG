import os
import os.path

import pandas as pd, numpy as np
import pyarrow.parquet as pq
import matplotlib.pyplot as plt
import scipy
from scipy import signal
from scipy.signal import savgol_filter
import tensorflow as tf
from pywt import wavedec
import concurrent
import pickle,gzip
import xgboost as xgb
import sklearn
import keras
from keras import layers
from keras import ops

# ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

df_train=pd.read_csv('/kaggle/input/hms-harmful-brain-activity-classification/train.csv')
df_search=df_train[["eeg_id","eeg_label_offset_seconds"]]
df_search_np=df_search.to_numpy(dtype=int)
EEG_Tag=df_train['eeg_id'].unique()
EEG_Path='/kaggle/input/hms-harmful-brain-activity-classification/train_eegs/'
print(len(df_train['eeg_id'].unique()))
print(len(df_train['patient_id'].unique()))

# –––––––––––––––––

df_train.head(5)

# –––––––––––––––––

eeg= pd.read_parquet('/kaggle/input/example/2289322082.parquet')
eeg.columns

# –––––––––––––––––

eeg_np=eeg.to_numpy()
x = np.linspace(0,30, 6000)
fig, axs = plt.subplots(1,1, figsize=(8,4))
axs.plot(x,eeg_np[:,0][:6000])
axs.set_title('Fp1')
axs.axis([0, 30, -850, 120])
axs.set_xlabel('Time [s]')
axs.set_ylabel('Voltage [μV]')
threshold = -120
axs.fill_between(x,25,-600,where=eeg_np[:,0][:6000]< threshold  , color='cyan', alpha=0.4, transform=axs.get_xaxis_transform())

###Filtro

# –––––––––––––––––

x = np.linspace(0,20, 4000)
fig, axs = plt.subplots(1,1, figsize=(8,4))
sos = signal.butter(2, 0.1, 'hp', fs=200, output='sos')
filtered = signal.sosfilt(sos, eeg_np[:,0][:4000])
x_sg=savgol_filter(filtered, 17, 2)
axs.plot(x, x_sg)
axs.set_title('Filtered signal (Fp1)')
axs.set_xlabel('Time [s]')
axs.set_ylabel('Voltage [μV]')
plt.show()

# –––––––––––––––––

(cA4, cD4, cD3, cD2,cD1) = wavedec(x_sg, 'db4', level=4,mode='smooth')
x1 = np.linspace(0,20, len(cD1))
fig, axs= plt.subplots(5,1, figsize=(10,20))
axs[0].plot(x1[:], cD1)
axs[0].set_title('cD1 Coeficient')
x2 = np.linspace(0,20, len(cD2))
axs[1].plot(x2, cD2)
axs[1].set_title('cD2 Coeficient')
x3 = np.linspace(0,20, len(cD3))
axs[2].plot(x3, cD3)
axs[2].set_title('cD3 Coeficient')
x4 = np.linspace(0,20, len(cD4))
axs[3].plot(x4, cD4)
axs[3].set_title('cD4 Coeficient')
x5= np.linspace(0,20, len(cA4))
axs[4].plot(x4, cA4)
axs[4].set_title('cA4 Coeficient')
axs[4].set_xlabel('Time [s]')

plt.show()

# –––––––––––––––––

def Filter(x):
    sos = signal.butter(2, 0.1, 'hp', fs=200, output='sos')
    filt_1Hz = signal.sosfilt(sos, x)
    x_filtered=savgol_filter(filt_1Hz, 17, 2)
    return  x_filtered

def Filtering(M):
    eeg_np=M.fillna(0).to_numpy()
    for i in range(19):
        eeg_np[:,i]=Filter(eeg_np[:,i])
    return eeg_np

# –––––––––––––––––

def Stats_DWT(subband_x):
    Mean=np.mean(np.absolute(subband_x))
    AVP=scipy.stats.pmean(np.absolute(subband_x),2,weights=None)
    SD=subband_x.std()
    Skew=scipy.stats.skew(subband_x)
    Kurt=scipy.stats.kurtosis(subband_x)
    absum=np.sum(np.absolute(subband_x))
    return Mean,AVP,SD, Skew,Kurt,absum

def DWT_Features(xf):
    (cA4, cD4, cD3, cD2,cD1) = wavedec(xf, 'db4', level=4,mode='smooth')
    f_cA4=Stats_DWT(cA4)
    f_cD4=Stats_DWT(cD4)
    f_cD3=Stats_DWT(cD3)
    f_cD2=Stats_DWT(cD2)  
    #f_cD1=Stats_DWT(cD1)
    r1=np.sum(np.absolute(cD1))/f_cD2[5]
    r2=f_cD2[5]/f_cD3[5]
    r3=f_cD3[5]/f_cD4[5]
    r4=f_cD4[5]/f_cA4[5]  
    return np.concatenate((f_cA4[:5],f_cD4[:5],f_cD3[:5],f_cD2[:5],r1,r2,r3,r4), axis=None)

# –––––––––––––––––

def single_channel(eeg_np):
    Fp1_f7=eeg_np[:,0]-eeg_np[:,4]  
    F7_T3=eeg_np[:,4]-eeg_np[:,5]  
    T3_T5=eeg_np[:,5]-eeg_np[:,6]
    T5_O1=eeg_np[:,6]-eeg_np[:,7]
    Fp2_F8=eeg_np[:,11]-eeg_np[:,15]  
    F8_T4=eeg_np[:,15]-eeg_np[:,16]  
    T4_T6=eeg_np[:,16]-eeg_np[:,17]
    T6_O2=eeg_np[:,17]-eeg_np[:,18]
    Fp1_F3=eeg_np[:,0]-eeg_np[:,1]
    F3_C3=eeg_np[:,1]-eeg_np[:,2] 
    C3_P3=eeg_np[:,2]-eeg_np[:,3]  
    P3_O1=eeg_np[:,3]-eeg_np[:,7]
    Fp2_F4=eeg_np[:,11]-eeg_np[:,12]
    F4_C4=eeg_np[:,12]-eeg_np[:,13]
    C4_P4=eeg_np[:,13]-eeg_np[:,14] 
    P4_O2=eeg_np[:,14]-eeg_np[:,18]
    Fz_Cz=eeg_np[:,8]-eeg_np[:,9] 
    Cz_Pz =eeg_np[:,9]-eeg_np[:,10]

    ch1=DWT_Features(Fp1_f7)
    ch2=DWT_Features(F7_T3)
    ch3=DWT_Features(T3_T5)
    ch4=DWT_Features(T5_O1)
    ch5=DWT_Features(Fp2_F8)
    ch6=DWT_Features(F8_T4)
    ch7=DWT_Features(T4_T6)
    ch8=DWT_Features(T6_O2)
    ch9=DWT_Features(Fp1_F3)
    ch10=DWT_Features(F3_C3)
    ch11=DWT_Features(C3_P3)
    ch12=DWT_Features(P3_O1)
    ch13=DWT_Features(Fp2_F4)
    ch14=DWT_Features(F4_C4)
    ch15=DWT_Features(C4_P4)
    ch16=DWT_Features(P4_O2)
    ch17=DWT_Features(Fz_Cz)
    ch18=DWT_Features(Cz_Pz)
    channel_features=np.concatenate((ch1,ch2,ch3,ch4,ch5,ch6,ch7,ch8,ch9,ch10,ch11,ch12,ch13,ch14,ch15,ch16,ch17,ch18), axis=None)
    return channel_features

# –––––––––––––––––

def shift_offset(Multichannel, file_tag):
    signal_features=np.array([])
    aux=df_search_np[df_search_np==file_tag]
    row=file_tag
    offset_values=df_search_np[:len(aux)][aux==row, :][:,1]
    Matrix_features=np.empty([len(aux),432])
    Multichannel=Filtering(Multichannel)
    for i in range(len(aux)):
        if len(np.argwhere(np.isnan(Multichannel).any(axis=1)))<=10:
            eeg_np=Multichannel[(offset_values[i]+20)*200:(offset_values[i]+30)*200]
            channel_features=single_channel(eeg_np)
            Matrix_features[i:]=channel_features
        else:
            Matrix_features[:]=np.nan
    return Matrix_features   

# –––––––––––––––––

def process_parquet_file(file_tag):
    if os.path.isfile(f'{EEG_Path}{file_tag}.parquet'):
        eeg_np = pd.read_parquet(f'{EEG_Path}{file_tag}.parquet')
        result = shift_offset(eeg_np,file_tag) 
    else:
        rows=df_search_np[df_search_np[:,0]==file_tag].shape[0]
        Matrix_features=np.empty([rows,432])
        Matrix_features[:]=np.nan
        result=Matrix_features
        
    return result

# –––––––––––––––––

def process_iteration(EEG_Tag):
    L=[]
    with concurrent.futures.ProcessPoolExecutor() as executor:
        Files_created=EEG_Tag
        results=executor.map(process_parquet_file,Files_created)
        for result in results:
            L.append(result)
        Matrix_Features=np.vstack(L)
    return Matrix_Features  
Full=process_iteration(EEG_Tag)
Full.shape

# –––––––––––––––––

def clean(df_train,Full):
    y_labels=np.array(df_train[['seizure_vote','lpd_vote', 'gpd_vote','lrda_vote','grda_vote' , 'other_vote']])
    k=1/y_labels.sum(axis=1)
    t=k.reshape(-1,1)
    y_prob=t*y_labels
    index_nan=np.argwhere(np.asarray(np.isnan(Full),dtype=int).sum(axis=1)>0)
    Full_clean=np.delete(Full, index_nan, axis=0)
    y_labels_clean=np.delete(y_labels,index_nan,axis=0)
    y_prob_clean=np.delete(y_prob,index_nan,axis=0)
    return (Full_clean, y_labels_clean, y_prob_clean)

# –––––––––––––––––

Full_clean, y_labels_clean, y_prob_clean=clean(df_train,Full)
y_labels_clean

# –––––––––––––––––

def discrep(y_labels_clean):
    max=y_labels_clean.max(axis=1).reshape(-1, 1)
    y_full_one_hot = np.where(y_labels_clean == max, 1, 0)
    index_discrep=np.argwhere(y_full_one_hot.sum(axis=1)>1)
    return y_full_one_hot,index_discrep

# –––––––––––––––––

y_full_one_hot,index_discrep=discrep(y_labels_clean)

# –––––––––––––––––

def consensus(Full_clean,y_full_one_hot,y_prob_clean,index_discrep):
    X_consensus=np.delete(Full_clean, index_discrep, axis=0)
    y_consensus=np.delete(y_full_one_hot,index_discrep,axis=0)
    y_prob_cons=np.delete(y_prob_clean,index_discrep,axis=0)
    y_consensus=(y_consensus > 0).nonzero()[1]
    sample_weights=y_prob_cons.max(axis=1)
    return (X_consensus,y_consensus,y_prob_cons,sample_weights)


# –––––––––––––––––

X_consensus,y_consensus,y_prob_cons,sample_weights=consensus(Full_clean,y_full_one_hot,y_prob_clean,index_discrep)

# –––––––––––––––––

def permutation (X_consensus,y_consensus,y_prob_cons,sample_weights):
    permutation = np.array([i for i in range(len(X_consensus))])
    np.random.seed(1)
    np.random.shuffle(permutation)
    X_perm = np.array([X_consensus[i] for i in permutation])
    y_perm = np.array([y_consensus[i] for i in permutation])
    sample_weights=np.array([sample_weights[i] for i in permutation])
    y_prob_perm = np.array([y_prob_cons[i] for i in permutation])
    factor=int((X_perm.shape[0])*0.8)
    weights_train=sample_weights[:factor].flatten()
    weights_val=sample_weights[factor:].flatten()
    X_train=X_perm[:factor]
    y_train=y_perm[:factor]
    y_prob_train=y_prob_perm[:factor]
    X_val=X_perm[factor:]
    y_val=y_perm[factor:]
    y_prob_val=y_prob_perm[factor:]


###
    X_discrep=Full_clean[index_discrep].reshape(-1,432)
    y_prob_discrep=y_prob_clean[index_discrep].reshape(-1,6)
    return (weights_train,weights_val,X_train,y_train,y_prob_train,X_val,y_val,y_prob_val,X_discrep,y_prob_discrep)

# –––––––––––––––––

weights_train,weights_val,X_train,y_train,y_prob_train,X_val,y_val,y_prob_val,X_discrep,y_prob_discrep=permutation(X_consensus,y_consensus,y_prob_cons,sample_weights)

# –––––––––––––––––

X=np.concatenate([X_train,X_val],axis=0)
y=np.concatenate([y_train,y_val],axis=0)
w=np.concatenate([weights_train,weights_val],axis=0)

# –––––––––––––––––

xgb_model = xgb.XGBClassifier(objective='multi:softprob',n_classes=6, max_depth=8,subsample=0.8, colsample_bytree=0.8,tree_method='hist',learning_rate=0.04, device='cuda:1',n_estimators=60,verbosity=0)
xgb_model.fit(X, y,sample_weight=[(w)])

# –––––––––––––––––

kl = tf.keras.losses.KLDivergence()
print(kl(y_prob_discrep,xgb_model.predict_proba(X_discrep)).numpy())

# –––––––––––––––––

X_traink=np.concatenate([X_train,X_discrep],axis=0)
y_prob_traink=np.concatenate([y_prob_train,y_prob_discrep],axis=0)
X_valk=X_val  
y_prob_valk=y_prob_val

# –––––––––––––––––

inputs = keras.Input(shape=(432,), name="digits")
x = layers.Dense(300, activation="relu", name="dense_1")(inputs)
x = layers.Dense(200, activation="relu", name="dense_2")(x)
x = layers.Dense(100, activation="relu", name="dense_3")(x)
outputs = layers.Dense(6, activation="softmax", name="predictions")(x)
model_x= keras.Model(inputs=inputs, outputs=outputs)

# –––––––––––––––––

opt=keras.optimizers.Adam(
    learning_rate=0.0005,
    beta_1=0.9,
    beta_2=0.999,
    epsilon=1e-07,
    amsgrad=False,
    weight_decay=None,
    clipnorm=None,
    clipvalue=None,
    global_clipnorm=None,
    use_ema=False,
    ema_momentum=0.99,
    ema_overwrite_frequency=None,
    name="adam"
)

# –––––––––––––––––

model_x.compile( optimizer=opt,
    loss=keras.losses.KLDivergence(reduction="sum_over_batch_size", name="kl_divergence"),
                )

# –––––––––––––––––

np.random.seed(8)
keras.utils.set_random_seed(8)
print("Fit model on training data")
history = model_x.fit(
    X_traink,
    y_prob_traink,
    batch_size=32,
    epochs=20,
    validation_data=(X_valk, y_prob_valk),
)

# –––––––––––––––––

pd.DataFrame(history.history).plot(figsize=(8, 5))
plt.grid(True)
plt.gca().set_ylim(0, 4)
plt.gca().set_title('Loss Function (Keras Model)')
plt.gca().set_xlabel('Epoch')
plt.gca().set_ylabel('Kullback Leibler Divergence')
plt.show()

# –––––––––––––––––

df_test=pd.read_csv('/kaggle/input/hms-harmful-brain-activity-classification/test.csv')
df_test

# –––––––––––––––––

test_search=df_train[["eeg_id"]]
test_search_np=df_search.to_numpy(dtype=int)

EEG_TEST=df_test['eeg_id'].unique()
test_Path='/kaggle/input/hms-harmful-brain-activity-classification/test_eegs/'

# –––––––––––––––––

def no_offset(Multichannel, file_tag):
    Multichannel=Filtering(Multichannel)
    if Multichannel.shape[0]>5000:
        eeg_np=Multichannel[20*200:30*200]
        if len(np.argwhere(np.isnan(Multichannel).any(axis=1)))<=10:
            channel_features=single_channel(eeg_np)
            Matrix_features=channel_features
        else:
            Matrix_features=np.empty(1,360)
            Matrix_features[:]=np.nan
    return Matrix_features   

# –––––––––––––––––

def process_test_file(file_tag):
    if os.path.isfile(f'{test_Path}{file_tag}.parquet'):
        eeg_np = pd.read_parquet(f'{test_Path}{file_tag}.parquet')
        result = no_offset(eeg_np,file_tag) 
    return result

# –––––––––––––––––

L=[]
with concurrent.futures.ProcessPoolExecutor() as executor:
    Files_created=EEG_TEST
    results=executor.map(process_test_file,Files_created)
    for result in results:
        L.append(result)
        print("", len(L), end="")
    Test_Features=np.vstack(L)
Test_Features.shape

# –––––––––––––––––

pred1=xgb_model.predict_proba(Test_Features)
pred2=model_x.predict(Test_Features)
prediccion=pred1*0.5+pred2*0.5

# –––––––––––––––––

egg_t = df_test[["eeg_id"]].copy()
target =[ 'seizure_vote','lpd_vote', 'gpd_vote','lrda_vote','grda_vote' , 'other_vote']
egg_t[target] = prediccion.tolist()
sub= pd.read_csv('/kaggle/input/hms-harmful-brain-activity-classification/sample_submission.csv')
sub= sub[["eeg_id"]].copy()
sub = sub.merge(egg_t, on="eeg_id", how="left")
sub.to_csv("submission.csv", index=False)
sub.head()

# Guardar modelo XGBoost
xgb_model.save_model('modelo_xgb.json')

# Guardar modelo Keras
model_x.save('modelo_keras.h5')
