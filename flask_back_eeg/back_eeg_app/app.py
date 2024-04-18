from flask import Flask, jsonify, request, url_for, Response
from flask_cors import CORS, cross_origin
from extensions import db, migrate, jwt, bcrypt
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from werkzeug.exceptions import BadRequest
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from flask_mail import Mail, Message
from mne.io import RawArray
from mne.io import read_raw_edf
from mne.filter import filter_data
from mne.preprocessing import ICA, create_eog_epochs
from sklearn.decomposition import PCA
from scipy.signal import stft
import os
import mne
import json
import logging
import numpy as np
import pandas as pd

# Load environment variables from .env file
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)
CORS(app)
#CORS(app, resources={r"/api/*": {"origins": "http://localhost:4200"}})

# Configure the application
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
token_secret_key = os.getenv('TOKEN_SECRET_KEY')

# Initialize the logger
s = URLSafeTimedSerializer(token_secret_key)

# Initialize the extensions
db.init_app(app)
migrate.init_app(app, db)
bcrypt.init_app(app)
jwt = JWTManager(app)
mail = Mail(app)

# Import the models
from models import Usuario, Rol, Genero, EstadoCivil, Escolaridad, Lateralidad, Ocupacion, Paciente, Telefono, CorreoElectronico, Direccion, HistorialMedico, sesion_medicamento, DiagnosticoPrevio, Sesion, Consentimiento, RawEEG, NormalizedEEG, Medicamento, ContactoEmergencia

# Route to check if the server is up   
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'up'}), 200

######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################ User Authentication #################################################################
@app.route('/login', methods=['POST'])
def login():
    """
    Endpoint for user login.
    Requires a JSON with 'username' and 'password'.
    If the credentials are correct and the user is approved, a JWT access token is returned.
    ·Parameters:
        username: str - The username of the user.
        contraseña: str - The password of the user.
    ·Responses:
        200: If the login was successful and the user is approved.
        400: If the JSON, username, or password were not provided.
        401: If the credentials are incorrect.
        403: If the user is not approved.
        500: If an internal server error occurred.
    ·Usage example:
        POST /login
        {
            "username": "user",
            "contraseña": "password"
        }
    """
    try:
        if not request.is_json:
            return jsonify({"msg": "Falta el JSON en la solicitud"}), 400
        username = request.json.get('username', None)
        password = request.json.get('contraseña', None)
        if not username:
            return jsonify({"msg": "Falta el username"}), 400
        if not password:
            return jsonify({"msg": "Falta la contraseña"}), 400
        # Verify if the user exists
        user = Usuario.query.filter_by(username=username).first()
        # Verify the password
        if user and bcrypt.check_password_hash(user.contraseña, password):
            # Aditional verification for user approval
            if not user.aprobacion:
                return jsonify({"msg": "Usuario no aprobado. Por favor, espera a que un administrador apruebe tu cuenta."}), 403
            # Create the access token
            access_token = create_access_token(identity=username)
            logging.info('Usuario %s ha iniciado sesión exitosamente.', username)
            return jsonify(access_token=access_token), 200
        else:
            logging.warning('Intento de inicio de sesión fallido para el usuario: %s', username)
            return jsonify({"msg": "Credenciales incorrectas"}), 401
    except Exception as e:
        logging.error('Error durante el inicio de sesión: %s', e)
        return jsonify({"message": "Error interno del servidor durante el inicio de sesión"}), 500

@app.route('/solicitar_cambio_contrasena', methods=['POST'])
def solicitar_cambio_contrasena():
    """
    Endpoint to request a password change.
    Requires a JSON with 'username'.
    If the user exists, an email is sent with a link to reset the password.
    ·Parameters:
        username: str - The username of the user.
    ·Responses:
        200: If the email was successfully sent.
        400: If the JSON or username were not provided.
        404: If the user was not found.
        500: If an internal server error occurred.
    ·Usage example:
        POST /solicitar_cambio_contrasena
        {
            "username": "user"
        }
    """
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({"msg": "Ningun dato adjuntado."}), 400
        username = datos.get('username', None)
        if not username:
            return jsonify({"msg": "Ningun usuario adjuntado"}), 40
        usuario = Usuario.query.filter_by(username=username).first()
        if not usuario:
            return jsonify({"msg": "Usuario no encontrado."}), 404
        token = s.dumps(usuario.correo, salt='cambio-contrasena')
        link = url_for('resetear_contraseña', token=token, _external=True)
        msg = Message("Restablece tu contraseña", recipients=[usuario.correo])
        msg.body = f"Por favor, haz click en el siguiente enlace para restablecer tu contraseña: {link}"
        msg.charset = 'utf-8'
        mail.send(msg)
        logging.info('Correo electrónico de restablecimiento de contraseña enviado a: %s', usuario.correo)
        return jsonify({"msg": "Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña."}), 200
    except Exception as e:
        logging.error('Error al solicitar el cambio de contraseña: %s', e)
        return jsonify({"msg": "Ocurrió el error: " + str(e)}), 500

@app.route('/resetear_contrasena/<token>', methods=['POST'])
def resetear_contraseña(token):
    """
    Endpoint to reset the password.
    Requires a JSON with 'nueva_contrasena' and a valid token in the URL.
    If the token is valid and has not expired, the user's password is updated.
    ·Parameters:
        token: str - The token for password reset.
        nueva_contrasena: str - The new password.
    ·Responses:
        200: If the password was successfully updated.
        400: If the token has expired or is invalid.
        404: If the user was not found.
    ·Usage example:
        POST /resetear_contrasena/<token>
        {
            "nueva_contrasena": "new_password"
        }
    """
    try:
        datos = request.get_json()
        nueva_contrasena = datos.get('nueva_contrasena', None)
        correo = s.loads(token, salt='cambio-contrasena', max_age=3600)  # 3600 seconds = 1 hour
        usuario = Usuario.query.filter_by(correo=correo).first()
        if usuario:
            hashed_password = bcrypt.generate_password_hash(nueva_contrasena).decode('utf-8')
            usuario.contraseña = hashed_password
            db.session.commit()
            logging.info('Contraseña actualizada para el usuario: %s', usuario.username)
            return jsonify({"msg": "Tu contraseña ha sido actualizada."}), 200
        else:
            logging.warning('Intento de restablecimiento de contraseña para usuario no existente: %s', correo)
            return jsonify({"msg": "Usuario no encontrado."}), 404
    except SignatureExpired:
        logging.warning('Enlace de restablecimiento de contraseña expirado para: %s', correo)
        return jsonify({"msg": "El enlace para restablecer la contraseña ha expirado."}), 400
    except BadSignature:
        logging.warning('Enlace de restablecimiento de contraseña inválido para: %s', correo)
        return jsonify({"msg": "Enlace inválido."}), 400

@app.route('/usuario/actual', methods=['GET'])
@jwt_required()
def obtener_usuario_actual():
    """
    Endpoint to get the current user's information.
    Requires a JWT access token.
    If the token is valid, the user's information is returned.
    ·Responses:
        200: If the user's information was successfully retrieved.
        404: If the user was not found.
        500: If an internal server error occurred.
    ·Usage example:
        GET /usuario/actual
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        # Obtain the user's identity
        identidad_usuario = get_jwt_identity()
        # Search for the user in the database
        usuario_actual = Usuario.query.filter_by(username=identidad_usuario).first()
        if usuario_actual:
            logging.info('Información del usuario actual obtenida para: %s', identidad_usuario)
            return jsonify({
                'id_usuario': usuario_actual.id_usuario,
                'nombre': usuario_actual.nombre,
                'apellidos': usuario_actual.apellidos,
                'id_rol': usuario_actual.id_rol
            }), 200
        else:
            logging.warning('Intento de obtener información del usuario actual para usuario no existente: %s', identidad_usuario)
            return jsonify({'mensaje': 'Usuario no encontrado'}), 404
    except Exception as e:
        logging.error('Error al obtener información del usuario actual: %s', e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500
######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################### CRUD for Users ###################################################################
@app.route('/usuarios', methods=['POST'])
def crear_usuario():
    """
    Endpoint to create a new user.
    Requires a JSON with 'username', 'contraseña', 'nombre', 'apellidos', 'correo', 'aprobacion', and 'id_rol'.
    If the data is valid and the role exists, a new user is created and saved to the database.
    ·Parameters:
        username: str - The username of the new user.
        contraseña: str - The password of the new user.
        nombre: str - The name of the new user.
        apellidos: str - The last name of the new user.
        correo: str - The email of the new user.
        aprobacion: bool - The approval status of the new user. Default is False.
        id_rol: int - The role id of the new user.
    ·Responses:
        201: If the user was successfully created.
        400: If the data is insufficient or the role is invalid.
        500: If an internal server error occurred.
    ·Usage example:
        POST /usuarios
        {
            "username": "user",
            "contraseña": "password",
            "nombre": "name",
            "apellidos": "last name",
            "correo": "email",
            "aprobacion": false,
            "id_rol": 1
        }
    """
    try:
        datos = request.get_json()
        if not datos or 'username' not in datos or 'contraseña' not in datos:
            logging.warning('Datos insuficientes para crear un usuario')
            return jsonify({'mensaje': 'Datos insuficientes para crear un usuario'}), 400
        # Verify if the user already exists
        rol = db.session.get(Rol, datos.get('id_rol'))
        if not rol:
            logging.warning('Rol no válido para la creación de usuario')
            return jsonify({'mensaje': 'Rol no válido'}), 400
        hashed_password = bcrypt.generate_password_hash(datos['contraseña']).decode('utf-8')
        nuevo_usuario = Usuario(
            nombre=datos.get('nombre'),
            apellidos=datos.get('apellidos'),
            username=datos.get('username'),
            contraseña=hashed_password,
            correo=datos.get('correo'),
            aprobacion=datos.get('aprobacion', False),  # Value is False by default waiting for admin approval
            id_rol=datos.get('id_rol')
        )
        db.session.add(nuevo_usuario)
        db.session.commit()
        logging.info('Usuario creado exitosamente: %s', nuevo_usuario.username)
        return jsonify({'mensaje': 'Usuario creado exitosamente'}), 201
    except Exception as e:
        db.session.rollback()
        logging.error('Error al crear usuario: %s', e)
        return jsonify({'error': 'Error al crear el usuario: {}'.format(str(e))}), 400

@app.route('/usuarios', methods=['GET'])
@jwt_required()
def obtener_usuarios():
    """
    Endpoint to retrieve all users.
    Requires a valid JWT access token.
    If the current user is an admin, all users except the current user are retrieved and returned.
    ·Responses:
        200: If the users' information was successfully retrieved.
        403: If the current user is not an admin.
        500: If an internal server error occurred.
    ·Usage example:
        GET /usuarios
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        current_user = get_jwt_identity()
        usuario_actual = Usuario.query.filter_by(username=current_user).first()
        if usuario_actual.id_rol != 1: 
            logging.warning('Acceso denegado: Solo administradores pueden realizar esta acción.')
            return jsonify({"msg": "Acceso denegado: Solo administradores pueden realizar esta acción."}), 403
        usuarios = Usuario.query.filter(Usuario.id_usuario != usuario_actual.id_usuario).all()
        resultado = [
            {
                'id_usuario': usuario.id_usuario,
                'nombre': usuario.nombre,
                'apellidos': usuario.apellidos,
                'username': usuario.username,
                'correo': usuario.correo,
                'aprobacion': usuario.aprobacion,
                'id_rol': usuario.id_rol,
                # Doesn't include the password
            } for usuario in usuarios
        ]
        return jsonify(resultado), 200
    except Exception as e:
        logging.error('Error al obtener información de usuarios: %s', e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/usuarios/<int:id_usuario>', methods=['GET'])
@jwt_required()
def obtener_usuario(id_usuario):
    """
    Endpoint to retrieve a specific user by their ID.
    Requires a valid JWT access token.
    If the current user is an admin, the user with the given ID is retrieved and returned.
    ·Parameters:
        id_usuario: int - The ID of the user to retrieve.
    ·Responses:
        200: If the user's information was successfully retrieved.
        403: If the current user is not an admin.
        404: If the user was not found.
        500: If an internal server error occurred.
    ·Usage example:
        GET /usuarios/<id_usuario>
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        current_user = get_jwt_identity()
        usuario_actual = Usuario.query.filter_by(username=current_user).first()
        if usuario_actual.id_rol != 1:
            logging.warning('Acceso denegado: Solo administradores pueden realizar esta acción.')
            return jsonify({"msg": "Acceso denegado: Solo administradores pueden realizar esta acción."}), 403
        usuario = Usuario.query.get_or_404(id_usuario)
        usuario_datos = {
            'id_usuario': usuario.id_usuario,
            'nombre': usuario.nombre,
            'apellidos': usuario.apellidos,
            'username': usuario.username,
            'correo': usuario.correo,
            'aprobacion': usuario.aprobacion,
            'id_rol': usuario.id_rol,
            # Doesn't include the password
        }
        return jsonify(usuario_datos), 200
    except Exception as e:
        logging.error('Error al obtener información del usuario %s: %s', id_usuario, e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/usuarios/<int:id_usuario>', methods=['PUT'])
@jwt_required()
def actualizar_usuario(id_usuario):
    """
    Endpoint to update a specific user by their ID.
    Requires a valid JWT access token.
    If the user exists, their data is updated and saved to the database.
    ·Parameters:
        id_usuario: int - The ID of the user to update.
    ·Request Body:
        JSON object with fields 'nombre', 'apellidos', 'username', 'contraseña', 'correo', 'aprobacion', and 'id_rol'.
    ·Responses:
        200: If the user was successfully updated.
        400: If the role is invalid.
        404: If the user was not found.
        500: If an internal server error occurred.
    ·Usage example:
        PUT /usuarios/<id_usuario>
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
        Body: {
            "nombre": "new name",
            "apellidos": "new last name",
            "username": "new username",
            "contraseña": "new password",
            "correo": "new email",
            "aprobacion": true,
            "id_rol": 2
        }
    """
    try:
        usuario = Usuario.query.get_or_404(id_usuario)
        datos = request.get_json()
        if 'id_rol' in datos:
            rol = db.session.get(Rol, datos.get('id_rol'))
            if not rol:
                logging.warning('Rol no válido para la actualización del usuario')
                return jsonify({'mensaje': 'Rol no válido'}), 400
            usuario.id_rol = datos['id_rol']
        usuario.nombre = datos.get('nombre', usuario.nombre)
        usuario.apellidos = datos.get('apellidos', usuario.apellidos)
        usuario.username = datos.get('username', usuario.username)
        if 'contraseña' in datos:
            usuario.contraseña = bcrypt.generate_password_hash(datos['contraseña']).decode('utf-8')
        usuario.correo = datos.get('correo', usuario.correo)
        usuario.aprobacion = datos.get('aprobacion', usuario.aprobacion)
        db.session.commit()
        logging.info('Usuario %s actualizado exitosamente', id_usuario)
        return jsonify({'mensaje': 'Usuario actualizado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        logging.error('Error al actualizar el usuario %s: %s', id_usuario, e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/usuarios/<int:id_usuario>/aprobacion', methods=['PUT'])
@jwt_required()
def cambiar_aprobacion_usuario(id_usuario):
    """
    Endpoint to update the approval status of a specific user by their ID.
    Requires a valid JWT access token.
    If the user exists and the approval data is valid, the user's approval status is updated and saved to the database.
    ·Parameters:
        id_usuario: int - The ID of the user whose approval status is to be updated.
    ·Request Body:
        JSON object with field 'aprobacion' (boolean).
    ·Responses:
        200: If the user's approval status was successfully updated.
        400: If the 'aprobacion' field is missing or the value is not valid.
        404: If the user was not found.
        500: If an internal server error occurred.
    ·Usage example:
        /usuarios/<id_usuario>/aprobacion
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
        Body: {
            "aprobacion": true
        }
    """
    try:
        datos = request.get_json()
        usuario = Usuario.query.get_or_404(id_usuario)
        if 'aprobacion' in datos and isinstance(datos['aprobacion'], bool):
            usuario.aprobacion = datos['aprobacion']
            db.session.commit()
            logging.info('Estado de aprobación del usuario %s actualizado exitosamente', id_usuario)
            return jsonify({'mensaje': 'Estado de aprobación actualizado exitosamente'}), 200
        else:
            logging.warning('Falta el campo de aprobación o el valor no es válido para el usuario %s', id_usuario)
            return jsonify({'error': 'Falta el campo de aprobación o el valor no es válido'}), 400
    except Exception as e:
        db.session.rollback()
        logging.error('Error al actualizar el estado de aprobación del usuario %s: %s', id_usuario, e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/usuarios/<int:id_usuario>', methods=['DELETE'])
@jwt_required()
def eliminar_usuario(id_usuario):
    """
    Endpoint to delete a specific user by their ID.
    Requires a valid JWT access token.
    If the user exists, they are deleted from the database.
    ·Parameters:
        id_usuario: int - The ID of the user to delete.
    ·Responses:
        200: If the user was successfully deleted.
        404: If the user was not found.
        500: If an internal server error occurred.
    ·Usage example:
        DELETE /usuarios/<id_usuario>
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        usuario = Usuario.query.get_or_404(id_usuario)
        db.session.delete(usuario)
        db.session.commit()
        logging.info('Usuario %s eliminado exitosamente', id_usuario)
        return jsonify({'mensaje': 'Usuario eliminado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        logging.error('Error al eliminar el usuario %s: %s', id_usuario, e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500
######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################ CRUD for Medications ################################################################
@app.route('/medicamentos', methods=['POST'])
@jwt_required()
def crear_medicamento():
    """
    Endpoint to create a new medication.
    Requires a valid JWT access token.
    Expects a JSON with 'nombre_comercial', 'principio_activo', and 'presentacion'.
    If the data is valid, a new medication is created and saved to the database.
    ·Request Body:
        JSON object with fields 'nombre_comercial', 'principio_activo', and 'presentacion'.
    ·Responses:
        201: If the medication was successfully created.
        400: If the required data is missing.
        500: If an internal server error occurred.
    ·Usage example:
        POST /medicamentos
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
        Body: {
            "nombre_comercial": "Medication Name",
            "principio_activo": "Active Ingredient",
            "presentacion": "Presentation"
        }
    """
    try:
        datos = request.get_json()
        nombre_comercial = datos.get('nombre_comercial')
        principio_activo = datos.get('principio_activo')
        presentacion = datos.get('presentacion')
        if not nombre_comercial or not principio_activo or not presentacion:
            return jsonify({'mensaje': 'Faltan datos necesarios para crear el medicamento'}), 400
        nuevo_medicamento = Medicamento(nombre_comercial=nombre_comercial, principio_activo=principio_activo, presentacion=presentacion)
        db.session.add(nuevo_medicamento)
        db.session.commit()
        logging.info('Medicamento creado exitosamente: %s', nuevo_medicamento.nombre_comercial)
        return jsonify({'mensaje': 'Medicamento creado exitosamente', 'id': nuevo_medicamento.id_medicamento}), 201
    except Exception as e:
        db.session.rollback()
        logging.error('Error al crear el medicamento %s: %s', nombre_comercial, e)
        return jsonify({'error': 'Error interno del servidor al crear el medicamento: {}'.format(str(e))}), 500

@app.route('/medicamentos', methods=['GET'])
@jwt_required()
def obtener_medicamentos():
    """
    Endpoint to retrieve all medications.
    Requires a valid JWT access token.
    All medications are retrieved and returned.
    ·Responses:
        200: If the medications were successfully retrieved.
        500: If an internal server error occurred.
    ·Usage example:
        GET /medicamentos
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        medicamentos = Medicamento.query.all()
        resultado = [{
            'id_medicamento': medicamento.id_medicamento,
            'nombre_comercial': medicamento.nombre_comercial,
            'principio_activo': medicamento.principio_activo,
            'presentacion': medicamento.presentacion
        } for medicamento in medicamentos]
        logging.info('Medicamentos obtenidos exitosamente')
        return jsonify(resultado), 200
    except Exception as e:
        logging.error('Error al obtener medicamentos: %s', e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/medicamentos/<int:id_medicamento>', methods=['GET'])
@jwt_required()
def obtener_medicamento_por_id(id_medicamento):
    """
    Endpoint to retrieve a specific medication by their ID.
    Requires a valid JWT access token.
    The medication with the given ID is retrieved and returned.
    ·Parameters:
        id_medicamento: int - The ID of the medication to retrieve.
    ·Responses:
        200: If the medication was successfully retrieved.
        404: If the medication was not found.
        500: If an internal server error occurred.
    ·Usage example:
        GET /medicamentos/<id_medicamento>
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        medicamento = Medicamento.query.get_or_404(id_medicamento)
        logging.info('Medicamento %s obtenido exitosamente', id_medicamento)
        return jsonify({
            'id_medicamento': medicamento.id_medicamento,
            'nombre_comercial': medicamento.nombre_comercial,
            'principio_activo': medicamento.principio_activo,
            'presentacion': medicamento.presentacion
        }), 200
    except Exception as e:
        logging.error('Error al obtener el medicamento %s: %s', id_medicamento, e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/medicamentos/<int:id_medicamento>', methods=['PUT'])
@jwt_required()
def actualizar_medicamento(id_medicamento):
    """
    Endpoint to update a specific medication by their ID.
    Requires a valid JWT access token.
    If the medication exists, their data is updated and saved to the database.
    ·Parameters:
        id_medicamento: int - The ID of the medication to update.
    ·Request Body:
        JSON object with fields 'nombre_comercial', 'principio_activo', and 'presentacion'.
    ·Responses:
        200: If the medication was successfully updated.
        404: If the medication was not found.
        500: If an internal server error occurred.
    ·Usage example:
        PUT /medicamentos/<id_medic>
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
        Body: {
            "nombre_comercial": "Updated Medication Name",
            "principio_activo": "Updated Active Ingredient",
            "presentacion": "Updated Presentation"
        }
    """
    try:
        medicamento = Medicamento.query.get_or_404(id_medicamento)
        datos = request.get_json()
        medicamento.nombre_comercial = datos.get('nombre_comercial', medicamento.nombre_comercial)
        medicamento.principio_activo = datos.get('principio_activo', medicamento.principio_activo)
        medicamento.presentacion = datos.get('presentacion', medicamento.presentacion)
        db.session.commit()
        logging.info('Medicamento %s actualizado exitosamente', id_medicamento)
        return jsonify({'mensaje': 'Medicamento actualizado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        logging.error('Error al actualizar el medicamento %s: %s', id_medicamento, e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/medicamentos/<int:id_medicamento>', methods=['DELETE'])
@jwt_required()
def eliminar_medicamento(id_medicamento):
    """
    Endpoint to delete a specific medication by their ID.
    Requires a valid JWT access token.
    If the medication exists, they are deleted from the database.
    ·Parameters:
        id_medicamento: int - The ID of the medication to delete.
    ·Responses:
        200: If the medication was successfully deleted.
        404: If the medication was not found.
        500: If an internal server error occurred.
    ·Usage example:
        DELETE /medicamentos/<id_medicamento>
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        medicamento = Medicamento.query.get_or_404(id_medicamento)
        db.session.delete(medicamento)
        db.session.commit()
        logging.info('Medicamento %s eliminado exitosamente', id_medicamento)
        return jsonify({'mensaje': 'Medicamento eliminado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        logging.error('Error al eliminar el medicamento %s: %s', id_medicamento, e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/medicamentos/pacientes/<int:id_paciente>/medicamentos', methods=['GET'])
@jwt_required()
def obtener_medicamentos_por_paciente(id_paciente):
    """
    Endpoint to retrieve medication details for a specific patient.
    Requires a valid JWT access token.
    Provides detailed medication information for all sessions, including the psychologist's notes.
    ·Parameters:
        id_paciente: int - The ID of the patient for whom the medication details are being retrieved.
    ·Responses:
        200: If the medication details were successfully retrieved. Returns a list of medication details and psychologist's notes.
        404: If the patient was not found.
        500: If an internal server error occurred.
    ·Usage example:
        GET /pacientes/<id_paciente>/medicamentos
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        # Making sure the patient exists
        paciente = Paciente.query.get_or_404(id_paciente)
        # Obtain all the sessions for the patient
        sesiones = Sesion.query.filter_by(id_paciente=id_paciente).order_by(Sesion.fecha_consulta.desc()).all()
        # List to store the medications and the psychologist's notes
        medicamentos_detalle = []
        # Go through each session to extract the medications and notes for each one
        for sesion in sesiones:
            fecha_sesion = sesion.fecha_consulta.strftime('%Y-%m-%d')
            notas_psicologo = sesion.notas_psicologo
            for medicamento in sesion.medicamentos:
                medicamentos_detalle.append({
                    'id_medicamento': medicamento.id_medicamento,
                    'nombre_comercial': medicamento.nombre_comercial,
                    'principio_activo': medicamento.principio_activo,
                    'presentacion': medicamento.presentacion,
                    'fecha_sesion': fecha_sesion,
                    'notas_psicologo': notas_psicologo
                })
        logging.info('Medicamentos obtenidos exitosamente para el paciente %s', id_paciente)
        return jsonify(medicamentos_detalle), 200
    except Exception as e:
        logging.error('Error al obtener medicamentos para el paciente %s: %s', id_paciente, e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500
######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################# CRUD for Patients ##################################################################
@app.route('/usuarios/<int:id_usuario>/pacientes', methods=['POST'])
@jwt_required()
def crear_paciente_para_usuario(id_usuario):
    """
    Endpoint to create a new patient for a specific user.
    Requires a valid JWT access token.
    Expects a JSON with patient details including 'nombre', 'apellido_paterno', 'apellido_materno', 
    'fecha_nacimiento', 'id_genero', 'id_estado_civil', 'id_escolaridad', 'id_lateralidad', and 'id_ocupacion'.
    Validates user existence and saves the new patient to the database with optional details like phone numbers, emails, and addresses.
    ·Parameters:
        id_usuario: int - The ID of the user for whom the patient is being created.
    ·Request Body:
        JSON object with fields 'nombre', 'apellido_paterno', 'apellido_materno', 'fecha_nacimiento', 'id_genero', 
        'id_estado_civil', 'id_escolaridad', 'id_lateralidad', 'id_ocupacion', and optional fields 'telefonos', 
        'correos_electronicos', and 'direcciones'.
    ·Responses:
        201: If the patient was successfully created.
        404: If the user was not found.
        400: If there was an error in the request.
    ·Usage example:
        POST /usuarios/<id_usuario>/pacientes
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
        Body: {
            "nombre": "Patient Name",
            "apellido_paterno": "Patient Last Name",
            "apellido_materno": "Patient Second Last Name",
            "fecha_nacimiento": "Patient Birthdate",
            "id_genero": "Patient Gender ID",
            "id_estado_civil": "Patient Civil Status ID",
            "id_escolaridad": "Patient Education Level ID",
            "id_lateralidad": "Patient Laterality ID",
            "id_ocupacion": "Patient Occupation ID",
            "telefonos": ["Patient Phone Number"],
            "correos_electronicos": ["Patient Email"],
            "direcciones": ["Patient Address"]
        }
    """
    # Verify if the user exists
    usuario = Usuario.query.get_or_404(id_usuario)
    datos = request.get_json()
    print(datos)
    try:
        nuevo_paciente = Paciente(
            id_usuario=id_usuario,  # Use the ID of the user in the URL to create the patient for that user
            nombre=datos['nombre'],
            apellido_paterno=datos['apellido_paterno'],
            apellido_materno=datos.get('apellido_materno', ''),
            fecha_nacimiento=datos['fecha_nacimiento'],
            id_genero=datos['id_genero'],
            id_estado_civil=datos['id_estado_civil'],
            id_escolaridad=datos['id_escolaridad'],
            id_lateralidad=datos['id_lateralidad'],
            id_ocupacion=datos['id_ocupacion']
        )
        db.session.add(nuevo_paciente)
        print(nuevo_paciente)
        db.session.flush()  # For getting the ID of the new patient
        # Manejar la creación del contacto de emergencia
        if 'contacto_emergencia' in datos:
            contacto_data = datos['contacto_emergencia']
            contacto_emergencia = ContactoEmergencia(
                id_paciente=nuevo_paciente.id_paciente,
                nombre=contacto_data['nombre'],
                apellido_paterno=contacto_data['apellido_paterno'],
                apellido_materno=contacto_data.get('apellido_materno', ''),
                parentesco=contacto_data['parentesco'],
                telefono=contacto_data['telefono'],
                correo_electronico=contacto_data.get('correo_electronico', ''),
                direccion=contacto_data.get('direccion', ''),
                ciudad=contacto_data.get('ciudad', ''),
                estado=contacto_data.get('estado', ''),
                codigo_postal=contacto_data.get('codigo_postal', ''),
                pais=contacto_data.get('pais', ''),
                notas=contacto_data.get('notas', '')
            )
            db.session.add(contacto_emergencia)
            print(contacto_emergencia)
        if 'consentimientos' in datos:
            for consentimiento in datos['consentimientos']:
                if consentimiento['consentimiento'] == '1': 
                    print('soy true')
                    nuevo_consentimiento = Consentimiento(consentimiento=1, fecha_registro=consentimiento['fecha_registro'], id_paciente=nuevo_paciente.id_paciente)
                else:
                    print('soy false')
                    nuevo_consentimiento = Consentimiento(consentimiento=0, fecha_registro=consentimiento['fecha_registro'], id_paciente=nuevo_paciente.id_paciente)
                db.session.add(nuevo_consentimiento)
        # Add the phone numbers, emails and addresses
        if 'telefonos' in datos:
            for num in datos['telefonos']:
                nuevo_telefono = Telefono(telefono=num["telefono"], id_paciente=nuevo_paciente.id_paciente)
                db.session.add(nuevo_telefono)
                print(nuevo_telefono)
        if 'correos_electronicos' in datos:
            for email in datos['correos_electronicos']:
                nuevo_correo = CorreoElectronico(correo_electronico=email["correo_electronico"], id_paciente=nuevo_paciente.id_paciente)
                print(nuevo_correo.correo_electronico)
                db.session.add(nuevo_correo)
                print(nuevo_correo)
                print(email)
        if 'direcciones' in datos:
            for direccion in datos['direcciones']:
                nueva_direccion = Direccion(**direccion, id_paciente=nuevo_paciente.id_paciente)
                db.session.add(nueva_direccion)
                print(nueva_direccion)
        db.session.commit()
        logging.info('Paciente y contacto de emergencia creados exitosamente para el usuario %s', id_usuario)
        return jsonify({'mensaje': 'Paciente y contacto de emergencia creados exitosamente', 'id_paciente': nuevo_paciente.id_paciente}), 201
    except Exception as e:
        db.session.rollback()
        logging.error('Error al crear el paciente y contacto de emergencia para el usuario %s: %s', id_usuario, e)
        return jsonify({'error': str(e)}), 400

@app.route('/pacientes/por-psicologo', methods=['GET'])
@jwt_required()
def obtener_pacientes_agrupados_por_psicologo():
    """
    Endpoint to retrieve all patients grouped by their assigned psychologist.
    Requires a valid JWT access token.
    Retrieves detailed patient information including demographics, session count, and latest session notes for all psychologists.
    ·Responses:
        200: If the patients were successfully retrieved. Returns a nested list of patient objects grouped by psychologist.
        500: If an internal server error occurred.
    ·Usage example:
        GET /pacientes/por-psicologo
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        usuarios = Usuario.query.all()
        resultado = []
        for usuario in usuarios:
            pacientes_list = []
            pacientes = Paciente.query.filter_by(id_usuario=usuario.id_usuario).all()
            for paciente in pacientes:
                edad = (datetime.today().year - paciente.fecha_nacimiento.year - ((datetime.today().month, datetime.today().day) < (paciente.fecha_nacimiento.month, paciente.fecha_nacimiento.day)))
                sesiones = Sesion.query.filter_by(id_paciente=paciente.id_paciente).order_by(Sesion.fecha_consulta.desc()).all()
                numero_de_sesiones = len(sesiones)
                notas_ultima_sesion = sesiones[0].notas_psicologo if sesiones else ""
                pacientes_list.append({
                    'id_paciente': paciente.id_paciente,
                    'nombre': f"{paciente.nombre} {paciente.apellido_paterno} {paciente.apellido_materno}",
                    'fecha_nacimiento': paciente.fecha_nacimiento.strftime('%Y-%m-%d'),
                    'edad': edad,
                    'numero_de_sesiones': numero_de_sesiones,
                    'notas_ultima_sesion': notas_ultima_sesion,
                })
            resultado.append({
                'psicologo': f"{usuario.nombre} {usuario.apellidos}",
                'pacientes': pacientes_list
            })
        return jsonify(resultado), 200
    except Exception as e:
        logging.error('Error al obtener pacientes agrupados por psicólogo: %s', str(e))
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/usuarios/<int:id_usuario>/pacientes', methods=['GET'])
@jwt_required()
def obtener_pacientes_por_usuario(id_usuario):
    """
    Endpoint to retrieve all patients for a specific user.
    Requires a valid JWT access token.
    Retrieves detailed patient information including demographics, session count, and latest session notes.
    ·Parameters:
        id_usuario: int - The ID of the user for whom the patients are being retrieved.
    ·Responses:
        200: If the patients were successfully retrieved. Returns a list of patient objects.
        500: If an internal server error occurred.
    ·Usage example:
        GET /usuarios/<id_usuario>/pacientes
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        pacientes = Paciente.query.filter_by(id_usuario=id_usuario).all()
        resultado = []
        for paciente in pacientes:
            # Calculate the age of the patient
            today = datetime.today()
            edad = today.year - paciente.fecha_nacimiento.year - ((today.month, today.day) < (paciente.fecha_nacimiento.month, paciente.fecha_nacimiento.day))
            # Obtain the sessions for the patient
            sesiones = paciente.sesiones.order_by(Sesion.fecha_consulta.desc()).all() # Order by the date of the session
            numero_de_sesiones = len(sesiones)
            # Obtain the notes of the last session, if any
            notas_ultima_sesion = sesiones[0].notas_psicologo if sesiones else ""
            resultado.append({
                'id_paciente': paciente.id_paciente,
                'nombre': paciente.nombre,
                'apellido_paterno': paciente.apellido_paterno,
                'apellido_materno': paciente.apellido_materno or "",
                'fecha_nacimiento': paciente.fecha_nacimiento.strftime('%Y-%m-%d'),
                'edad': edad,
                'numero_de_sesiones': numero_de_sesiones,
                'notas_ultima_sesion': notas_ultima_sesion,
                'genero': paciente.genero.descripcion if paciente.genero else "",
                'estado_civil': paciente.estado_civil.descripcion if paciente.estado_civil else "",
                'escolaridad': paciente.escolaridad.descripcion if paciente.escolaridad else "",
                'lateralidad': paciente.lateralidad.descripcion if paciente.lateralidad else "",
                'ocupacion': paciente.ocupacion.descripcion if paciente.ocupacion else "",
            })
        logging.info('Pacientes obtenidos exitosamente para el usuario %s', id_usuario)
        return jsonify(resultado), 200
    except Exception as e:
        logging.error('Error al obtener pacientes para el usuario %s: %s', id_usuario, e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/pacientes/<int:id_paciente>/detalles', methods=['GET'])
@jwt_required()
def obtener_detalles_paciente(id_paciente):
    """
    Endpoint to retrieve detailed information for a specific patient.
    Requires a valid JWT access token.
    Returns comprehensive patient details including personal information, contacts (phone, email, address), 
    and consent status, as well as emergency contact information.
    ·Parameters:
        id_paciente: int - The ID of the patient for whom the details are being retrieved.
    ·Responses:
        200: If the patient details were successfully retrieved. Returns a patient object.
        404: If the patient was not found.
        500: If an internal server error occurred.
    ·Usage example:
        GET /pacientes/<id_paciente>/detalles
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        paciente = Paciente.query.get_or_404(id_paciente)
        today = datetime.today()
        edad = today.year - paciente.fecha_nacimiento.year - ((today.month, today.day) < (paciente.fecha_nacimiento.month, paciente.fecha_nacimiento.day))
        
        contacto_emergencia_info = {}
        if paciente.contacto_emergencia:
            ce = paciente.contacto_emergencia
            contacto_emergencia_info = {
                'nombre': ce.nombre,
                'apellido_paterno': ce.apellido_paterno,
                'apellido_materno': ce.apellido_materno or "",
                'parentesco': ce.parentesco,
                'telefono': ce.telefono,
                'correo_electronico': ce.correo_electronico or "",
                'direccion': ce.direccion or "",
                'ciudad': ce.ciudad or "",
                'estado': ce.estado or "",
                'codigo_postal': ce.codigo_postal or "",
                'pais': ce.pais or "",
                'notas': ce.notas or ""
            }
        
        detalles_paciente = {
            'id_paciente': paciente.id_paciente,
            'nombre': paciente.nombre,
            'apellido_paterno': paciente.apellido_paterno,
            'apellido_materno': paciente.apellido_materno or "",
            'fecha_nacimiento': paciente.fecha_nacimiento.strftime('%Y-%m-%d'),
            'edad': edad, # Calculated age
            'genero': paciente.genero.descripcion if paciente.genero else "",
            'estado_civil': paciente.estado_civil.descripcion if paciente.estado_civil else "",
            'escolaridad': paciente.escolaridad.descripcion if paciente.escolaridad else "",
            'lateralidad': paciente.lateralidad.descripcion if paciente.lateralidad else "",
            'ocupacion': paciente.ocupacion.descripcion if paciente.ocupacion else "",
            'telefonos': [{'telefono': tel.telefono} for tel in paciente.telefonos],
            'correos_electronicos': [{'correo_electronico': correo.correo_electronico} for correo in paciente.correos_electronicos],
            'direcciones': [{
                'calle_numero': direccion.calle_numero,
                'colonia': direccion.colonia,
                'ciudad': direccion.ciudad,
                'estado': direccion.estado,
                'pais': direccion.pais,
                'codigo_postal': direccion.codigo_postal
            } for direccion in paciente.direcciones],
            'consentimientos': [{
                'consentimiento': consent.consentimiento, 
                'fecha_registro': consent.fecha_registro.strftime('%Y-%m-%d %H:%M:%S')
            } for consent in paciente.consentimientos],
            'contacto_emergencia': contacto_emergencia_info
        }
        logging.info('Detalles del paciente %s obtenidos exitosamente', id_paciente)
        return jsonify(detalles_paciente), 200
    except Exception as e:
        logging.error('Error al obtener detalles del paciente %s: %s', id_paciente, e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/usuarios/<int:id_usuario>/pacientes/<int:id_paciente>', methods=['PUT'])
@jwt_required()
def actualizar_paciente_de_usuario(id_usuario, id_paciente):
    """
    Endpoint to update patient details for a specific user.
    Requires a valid JWT access token.
    Allows modification of patient's basic information and contacts (phone, email, address).
    Validates patient's existence and updates the information in the database.
    ·Parameters:
        id_usuario: int - The ID of the user who owns the patient record.
        id_paciente: int - The ID of the patient whose details are being updated.
    ·Responses:
        200: If the patient details were successfully updated. Returns a success message.
        400: If an error occurred while updating the patient details.
        404: If the patient was not found or does not belong to the indicated user.
    ·Usage example:
        PUT /usuarios/<id_usuario>/pacientes/<id_paciente>
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    # Verify if the user exists
    paciente = Paciente.query.filter_by(id_usuario=id_usuario, id_paciente=id_paciente).first()
    if paciente is None:
        return jsonify({'error': 'Paciente no encontrado o no pertenece al usuario indicado'}), 404
    datos = request.get_json()
    try:
        print(datos)
        actualizar_datos_basicos_paciente(paciente, datos)
        # Update the phone numbers, emails and addresses
        actualizar_telefonos(paciente, datos.get('telefonos', []))
        print(datos.get('telefonos', []))
        actualizar_correos(paciente, datos.get('correos_electronicos', []))
        print(datos.get('correos_electronicos', []))
        actualizar_direcciones(paciente, datos.get('direcciones', []))
        print(datos.get('direcciones', []))
        actualizar_contacto_emergencia(paciente, datos.get('contacto_emergencia', {}))
        print(datos.get('contacto_emergencia', {}))
        db.session.commit()
        print(paciente)
        logging.info('Paciente %s actualizado exitosamente para el usuario %s', id_paciente, id_usuario)
        return jsonify({'mensaje': 'Paciente actualizado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        logging.error('Error al actualizar el paciente %s para el usuario %s: %s', id_paciente, id_usuario, e)
        return jsonify({'error': 'Error al actualizar el paciente: {}'.format(str(e))}), 400

def actualizar_datos_basicos_paciente(paciente, datos):
    """
    Funtion to update the basic information of a patient.
    The function receives a patient object and a dictionary with the new data.
    The function updates the patient object with the new data.
    """
    paciente.nombre = datos.get('nombre', paciente.nombre)
    paciente.apellido_paterno = datos.get('apellido_paterno', paciente.apellido_paterno)
    paciente.apellido_materno = datos.get('apellido_materno', paciente.apellido_materno)
    paciente.fecha_nacimiento = datos.get('fecha_nacimiento', paciente.fecha_nacimiento)
    paciente.id_genero = datos.get('id_genero', paciente.id_genero)
    paciente.id_estado_civil = datos.get('id_estado_civil', paciente.id_estado_civil)
    paciente.id_escolaridad = datos.get('id_escolaridad', paciente.id_escolaridad)
    paciente.id_lateralidad = datos.get('id_lateralidad', paciente.id_lateralidad)
    paciente.id_ocupacion = datos.get('id_ocupacion', paciente.id_ocupacion)

def actualizar_telefonos(paciente, telefonos_nuevos):
    """
    Funtion to update the phone numbers of a patient.
    The function receives a patient object and a list of dictionaries with the new phone numbers.
    The function updates the phone numbers of the patient with the new data.
    """
    if telefonos_nuevos is not None:
        # Obtains the current phones of the patient
        telefonos_actuales = {tel.id_telefono: tel for tel in paciente.telefonos}
        for tel_data in telefonos_nuevos:
            print(tel_data)
            if 'id_telefono' in tel_data and tel_data['id_telefono'] in telefonos_actuales:
                telefono = telefonos_actuales.pop(tel_data['id_telefono'])
                telefono.telefono = tel_data['telefono']
            else:
                nuevo_telefono = Telefono(telefono=tel_data['telefono'], id_paciente=paciente.id_paciente)
                db.session.add(nuevo_telefono)
        # Delete any phone number not included in the update
        for tel in telefonos_actuales.values():
            db.session.delete(tel)

def actualizar_correos(paciente, correos_nuevos):
    """
    Funtion to update the email addresses of a patient.
    The function receives a patient object and a list of dictionaries with the new email addresses.
    The function updates the email addresses of the patient with the new data.
    """
    logging.info('Actualizando correos para el paciente %s', paciente.id_paciente)
    if correos_nuevos is not None:
        correos_actuales = {correo.id_correo: correo for correo in paciente.correos_electronicos.all()}
        correos_procesados = set()
        for correo_data in correos_nuevos:
            id_correo = correo_data.get('id_correo')
            correo_electronico = correo_data.get('correo_electronico')
            if id_correo:
                # Update the email if it already exists
                if id_correo in correos_actuales:
                    correo = correos_actuales[id_correo]
                    correo.correo_electronico = correo_electronico
                    correos_procesados.add(correo.id_correo)
                    logging.info('Correo actualizado: %s', correo_electronico)
            else:
                # Verify if the email already exists
                correo_existente = CorreoElectronico.query.filter_by(correo_electronico=correo_electronico, id_paciente=paciente.id_paciente).first()
                if correo_existente:
                    # The email already exists, add it to the processed set
                    correos_procesados.add(correo_existente.id_correo)
                    logging.info('Correo existente procesado: %s', correo_electronico)
                else:
                    # Insert the new email
                    nuevo_correo = CorreoElectronico(correo_electronico=correo_electronico, id_paciente=paciente.id_paciente)
                    db.session.add(nuevo_correo)
                    db.session.flush()  # This is necessary to get the ID of the new email
                    correos_procesados.add(nuevo_correo.id_correo)
                    logging.info('Nuevo correo agregado: %s', correo_electronico)
        # Delete any email not included in the update
        for id_correo, correo in correos_actuales.items():
            if id_correo not in correos_procesados:
                db.session.delete(correo)
                logging.info('Correo eliminado: %s', correo.correo_electronico)

def actualizar_direcciones(paciente, direcciones_nuevas):
    """
    Funtion to update the addresses of a patient.
    The function receives a patient object and a list of dictionaries with the new addresses.
    The function updates the addresses of the patient with the new data.
    """
    if direcciones_nuevas is not None:
        direcciones_actuales = {direccion.id_direccion: direccion for direccion in paciente.direcciones}
        for direccion_data in direcciones_nuevas:
            if 'id_direccion' in direccion_data and direccion_data['id_direccion'] in direcciones_actuales:
                direccion = direcciones_actuales.pop(direccion_data['id_direccion'])
                # Update the address data
                direccion.calle_numero = direccion_data.get('calle_numero', direccion.calle_numero)
                direccion.colonia = direccion_data.get('colonia', direccion.colonia)
                direccion.ciudad = direccion_data.get('ciudad', direccion.ciudad)
                direccion.estado = direccion_data.get('estado', direccion.estado)
                direccion.pais = direccion_data.get('pais', direccion.pais)
                direccion.codigo_postal = direccion_data.get('codigo_postal', direccion.codigo_postal)
            else:
                nueva_direccion = Direccion(
                    calle_numero=direccion_data['calle_numero'],
                    colonia=direccion_data['colonia'],
                    ciudad=direccion_data['ciudad'],
                    estado=direccion_data.get('estado'),
                    pais=direccion_data.get('pais'),
                    codigo_postal=direccion_data.get('codigo_postal'),
                    id_paciente=paciente.id_paciente
                )
                db.session.add(nueva_direccion)
        # Eliminar cualquier dirección no incluida en la actualización
        for direccion in direcciones_actuales.values():
            db.session.delete(direccion)

def actualizar_contacto_emergencia(paciente, datos_contacto):
    """
    Function to update emergency contact information for a patient.
    """
    contacto = paciente.contacto_emergencia
    if contacto:
        contacto.nombre = datos_contacto.get('nombre', contacto.nombre)
        contacto.apellido_paterno = datos_contacto.get('apellido_paterno', contacto.apellido_paterno)
        contacto.apellido_materno = datos_contacto.get('apellido_materno', contacto.apellido_materno)
        contacto.parentesco = datos_contacto.get('parentesco', contacto.parentesco)
        contacto.telefono = datos_contacto.get('telefono', contacto.telefono)
        contacto.correo_electronico = datos_contacto.get('correo_electronico', contacto.correo_electronico)
        contacto.direccion = datos_contacto.get('direccion', contacto.direccion)
        contacto.ciudad = datos_contacto.get('ciudad', contacto.ciudad)
        contacto.estado = datos_contacto.get('estado', contacto.estado)
        contacto.codigo_postal = datos_contacto.get('codigo_postal', contacto.codigo_postal)
        contacto.pais = datos_contacto.get('pais', contacto.pais)
        contacto.notas = datos_contacto.get('notas', contacto.notas)
    else:
        nuevo_contacto = ContactoEmergencia(
            id_paciente=paciente.id_paciente,
            **datos_contacto
        )
        db.session.add(nuevo_contacto)

@app.route('/admin/pacientes/<int:id_paciente>', methods=['DELETE'])
@jwt_required()
def eliminar_paciente_admin(id_paciente):
    """
    Endpoint for an admin to delete any patient.
    Requires a valid JWT access token and admin privileges.
    Removes the patient and all related data from the database.
    ·Parameters:
        id_paciente: int - The ID of the patient to be deleted.
    ·Responses:
        200: If the patient was successfully deleted. Returns a success message.
        404: If the patient is not found.
        500: If an internal server error occurred.
    ·Usage example:
        DELETE /admin/pacientes/<id_paciente>
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    # Here you would typically check if the current user has admin privileges
    # if not current_user.is_admin:
    #     return jsonify({'error': 'Acceso denegado. Se requieren privilegios de administrador.'}), 403

    paciente = Paciente.query.get_or_404(id_paciente)
    try:
        # Similar cleaning operations as in the non-admin endpoint
        ContactoEmergencia.query.filter_by(id_paciente=id_paciente).delete()
        sesiones = Sesion.query.filter_by(id_paciente=id_paciente).all()
        for sesion in sesiones:
            sesion.medicamentos.clear()
            db.session.delete(sesion)
        Telefono.query.filter_by(id_paciente=id_paciente).delete()
        CorreoElectronico.query.filter_by(id_paciente=id_paciente).delete()
        Direccion.query.filter_by(id_paciente=id_paciente).delete()
        HistorialMedico.query.filter_by(id_paciente=id_paciente).delete()
        DiagnosticoPrevio.query.filter_by(id_paciente=id_paciente).delete()
        Consentimiento.query.filter_by(id_paciente=id_paciente).delete()
        db.session.delete(paciente)
        db.session.commit()
        logging.info('Admin eliminó exitosamente al paciente %s', id_paciente)
        return jsonify({'mensaje': 'Paciente eliminado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        logging.error('Error al eliminar el paciente %s: %s', id_paciente, e)
        return jsonify({'error': 'Error al eliminar el paciente: ' + str(e)}), 500

@app.route('/usuarios/<int:id_usuario>/pacientes/<int:id_paciente>', methods=['DELETE'])
@jwt_required()
def eliminar_paciente(id_usuario, id_paciente):
    """
    Endpoint to delete a patient for a specific user.
    Requires a valid JWT access token.
    Validates the patient's association with the user before deletion. Removes the patient and all related data from the database.
    ·Parameters:
        id_usuario: int - The ID of the user who owns the patient record.
        id_paciente: int - The ID of the patient to be deleted.
    ·Responses:
        200: If the patient was successfully deleted. Returns a success message.
        403: If the patient is not associated with the user. Returns an error message.
        500: If an internal server error occurred.
    ·Usage example:
        DELETE /usuarios/<id_usuario>/pacientes/<id_paciente>
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    paciente = Paciente.query.get_or_404(id_paciente)
    if paciente.id_usuario != id_usuario:
        return jsonify({'error': 'Operación no permitida. Este paciente no pertenece al usuario.'}), 403
    try:
        ContactoEmergencia.query.filter_by(id_paciente=id_paciente).delete()
        sesiones = Sesion.query.filter_by(id_paciente=id_paciente).all()
        for sesion in sesiones:
            sesion.medicamentos = []
        for sesion in sesiones:
            db.session.delete(sesion)
        Telefono.query.filter_by(id_paciente=id_paciente).delete()
        CorreoElectronico.query.filter_by(id_paciente=id_paciente).delete()
        Direccion.query.filter_by(id_paciente=id_paciente).delete()
        HistorialMedico.query.filter_by(id_paciente=id_paciente).delete()
        DiagnosticoPrevio.query.filter_by(id_paciente=id_paciente).delete()
        Consentimiento.query.filter_by(id_paciente=id_paciente).delete()
        db.session.delete(paciente)
        db.session.commit()
        logging.info('Paciente %s eliminado exitosamente para el usuario %s', id_paciente, id_usuario)
        return jsonify({'mensaje': 'Paciente eliminado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        logging.error('Error al eliminar el paciente %s para el usuario %s: %s', id_paciente, id_usuario, e)
        return jsonify({'error': 'Error al eliminar el paciente: ' + str(e)}), 500
######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################ Procesamiento de EEG ################################################################
# INCOMPLETO – Falta trabajar en varias partes de este código, no va a funcionar tal como está
@app.route('/sesiones/nueva', methods=['POST'])
@jwt_required()
def crear_nueva_sesion():
    """
    Endpoint to create a new session with EEG data.
    Requires a valid JWT access token.
    Expects multipart/form-data with an 'archivo_eeg' file and additional form data including 'id_paciente', 
    'estado_general', 'estado_especifico' (as a list), 'resumen_sesion_actual', and 'medicamentos_ids' (as a list).
    Processes the uploaded EEG file, saving session details and EEG data (both raw and processed) to the database.
    Applies preprocessing steps like channel renaming, band-pass filtering, notch filtering, and ICA for artifact removal.
    Also calculates and stores the power spectral density (PSD) of the EEG signal.
    Returns the session ID upon successful creation and processing of the EEG data.
    """
    logging.info('Iniciando la creación de una nueva sesión')
    try:
        if 'archivo_eeg' not in request.files:
            raise BadRequest('No se encontró el archivo')
        archivo_eeg = request.files['archivo_eeg']
        if archivo_eeg.filename == '':
            raise BadRequest('No se seleccionó ningún archivo')
        datos = request.form
        id_paciente = datos.get('id_paciente')
        if not id_paciente:
            raise BadRequest('ID del paciente no proporcionado')
        estado_general = datos.get('estado_general')
        estado_especifico = datos.getlist('estado_especifico')  # Assumed to be a list
        resumen_sesion_actual = datos.get('resumen_sesion_actual')
        # medicamentos_ids = datos.getlist('medicamentos_ids')  # Assuming this is a list of IDs
        logging.info('Datos recibidos correctamente')
        # Save the EEG file temporarily
        path_temporal = os.path.join('/tmp', archivo_eeg.filename)
        archivo_eeg.save(path_temporal)
        logging.info('Archivo EEG guardado temporalmente')
        # Create an instance of the session and add it to the database
        nueva_sesion = Sesion(
            id_paciente=id_paciente,
            fecha_consulta=datetime.now(timezone.utc),
            estado_general=estado_general,
            estado_especifico=','.join(estado_especifico),
            resumen_sesion_actual=resumen_sesion_actual,
            notas_psicologo=''
        )
        db.session.add(nueva_sesion)
        db.session.flush()  # For getting the ID of the new session before committing
        logging.info('Nueva sesión creada y añadida a la base de datos')
        # Asoociate the medications with the session
        #for med_id in medicamentos_ids:
        #    medicamento = Medicamento.query.get(int(med_id))
        #    if medicamento:
        #        nueva_sesion.medicamentos.append(medicamento)
        #logging.info('Medicamentos asociados a la sesión')
        def renombrar_canales(ch_names):
            nuevos_nombres = []
            for ch in ch_names:
                nuevo_nombre = ch.replace('-A1', '')
                if len(nuevo_nombre) > 1 and nuevo_nombre[1].isalpha():
                    nuevo_nombre = nuevo_nombre[0] + nuevo_nombre[1].lower() + nuevo_nombre[2:]
                nuevos_nombres.append(nuevo_nombre)
            return nuevos_nombres
        try:
            # Read the EEG data from the .edf file
            raw = mne.io.read_raw_edf(path_temporal, preload=True)
            os.remove(path_temporal)  # Delete the temporary file
            logging.info('Archivo .edf leído y eliminado temporalmente')
            # Rename the channels to remove the '-A1' suffix and make them lowercase
            nuevos_nombres = renombrar_canales(raw.ch_names)
            raw.rename_channels({old: new for old, new in zip(raw.ch_names, nuevos_nombres)})
            logging.info('Canales renombrados')
            data_eeg_with_channels = {
                'names': nuevos_nombres,
                'data': raw.get_data().tolist()
                }
            datos_eeg_crudos_json = json.dumps(data_eeg_with_channels)
            nuevo_raw_eeg = RawEEG(
                id_sesion=nueva_sesion.id_sesion, 
                fecha_hora_registro=datetime.now(timezone.utc), 
                data=datos_eeg_crudos_json
            )
            db.session.add(nuevo_raw_eeg)
            logging.info('Datos EEG crudos convertidos a JSON y almacenados en RawEEG')
            # Pass-band filter to remove frequencies outside the 1-40 Hz range
            raw.filter(1., 40., fir_design='firwin')
            # Notch filter to remove 50 Hz noise and its harmonics 
            nyquist_freq = raw.info['sfreq'] / 2 # If the sampling frequency is 250 Hz, the Nyquist frequency is 125 Hz
            raw.notch_filter(np.arange(50, nyquist_freq, 50), fir_design='firwin')
            logging.info('Filtrado Notch y pasa-banda aplicados')
            # ICA to remove eye blinks and other artifacts
            n_channels = len(raw.ch_names)
            # Step 1: Determine the number of components for ICA based on the explained variance of PCA
            pca = PCA(n_components=min(n_channels, 20))  # Limiting to 20 components for computational efficiency
            data_transformed = pca.fit_transform(raw.get_data().transpose())
            explained_variance = pca.explained_variance_ratio_ # Percentage of variance explained by each component 
            # Step 2: Select the number of components for ICA that explain 99% of the variance 
            n_components_ica = np.argmax(np.cumsum(explained_variance) >= 0.99) + 1
            # Step 3: Apply ICA to the raw data to remove the components identified as artifacts
            ica = ICA(n_components=n_components_ica, random_state=97, max_iter=800)
            ica.fit(raw) # Fit the ICA to the raw data to identify the components to exclude 
            # Identify the components that are related to eye movements (EOG)
            #eog_indices, eog_scores = ica.find_bads_eog(raw)
            #ica.exclude = eog_indices
            ica.apply(raw) # Aplly the ICA to remove the components identified as artifacts
            logging.info('ICA aplicado')
            # Calculate the power spectral density (PSD) of the EEG data in the 1-40 Hz range using Welch's method 
            spectrum = raw.compute_psd(method='welch', fmin=1, fmax=40, n_fft=2048)
            psds, freqs = spectrum.get_data(return_freqs=True)
            # Convert the PSDs to decibels (dB) for visualization purposes
            psds_db = 10 * np.log10(psds)
            # Prepare the data for visualization in the frontend as a JSON object
            data_for_frontend = [
                {
                    'name': ch_name,
                    'data': psds_db[i].tolist(),
                    'pointStart': freqs[0],
                    'pointInterval': np.diff(freqs).mean()
                }
                for i, ch_name in enumerate(raw.ch_names)
            ]
            # At this point, the data is cleaned, filtered, ready for visualization and is ready to be stored in the database as a JSON object
            data_eeg_normalized_with_channels = {
                'names': nuevos_nombres,
                'data': raw.get_data().tolist()
                }
            
            datos_procesados_json = json.dumps(data_eeg_normalized_with_channels)  # Data cleaned and processed in JSON format
            datos_psd_json = json.dumps(data_for_frontend)  # Data of the PSD in JSON format
            # When storing the data in the database, it is necessary to store the PSD data as well
            print ('ACABADOOOOOOOO!!!!!!!!!!!!!!!!!!!!!')
            print('Empezando STFT')
            # Calculate the Short-Time Fourier Transform (STFT) of the EEG data
            stft_data = stft(raw.get_data(), 128)  # Usando ventanas de 128 puntos
            stft_magnitude_squared = np.abs(stft_data) ** 2
            data_stft = [{
                'name': ch,
                'magnitude_squared': stft_mag.tolist(),
                'times': np.arange(stft_data.shape[2]).tolist(),  # ajustar según tu configuración de STFT
                'frequencies': np.linspace(0, raw.info['sfreq'] / 2, stft_data.shape[1]).tolist()
            } for ch, stft_mag in zip(nuevos_nombres, stft_magnitude_squared)]
            data_stft_json = json.dumps(data_stft)  # Data of the STFT in JSON format
            nuevo_normalized_eeg = NormalizedEEG(
                id_sesion=nueva_sesion.id_sesion,
                fecha_hora_procesado=datetime.now(timezone.utc),
                data_normalized=datos_procesados_json,
                data_psd=datos_psd_json,  # Here we store the PSD data
                data_stft=data_stft_json  # Here we store the STFT data
            )
            db.session.add(nuevo_normalized_eeg)
            logging.info('Datos procesados almacenados en NormalizedEEG')
        except Exception as e:
            # Handle any errors that may occur during the processing of the EEG data
            logging.error(f"Error durante el procesamiento del EEG: {e}")
            raise
        db.session.commit()
        logging.info('Sesión y datos de EEG procesados y almacenados exitosamente')
        return jsonify({'mensaje': 'Sesión y datos de EEG procesados y almacenados exitosamente', 'id_sesion': nueva_sesion.id_sesion}), 200
    except BadRequest as e:
        db.session.rollback()
        logging.error('Error al procesar la solicitud: ' + str(e))
        return jsonify({'error': 'Error al procesar la solicitud: ' + str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logging.error('Error inesperado: ' + str(e))
        return jsonify({'error': 'Error inesperado: ' + str(e)}), 500
    finally:
        # Delete the temporary file in case of an error
        if os.path.exists(path_temporal):
            os.remove(path_temporal)
            logging.info('Archivo temporal eliminado')

@app.route('/sesiones/<int:id_sesion>/eegs', methods=['GET'])
@jwt_required()
def obtener_eegs_por_sesion(id_sesion):
    """
    Endpoint to retrieve EEG data for a specific session.
    Requires a valid JWT access token.
    Fetches and returns raw and normalized EEG data along with session details and associated medications.
    ·Parameters:
        id_sesion: int - The ID of the session for which the EEG data is being retrieved.
    ·Responses:
        200: If the EEG data was successfully retrieved. Returns a dictionary containing session details and EEG data.
        404: If the session was not found.
        500: If an internal server error occurred.
    ·Usage example:
        GET /sesiones/<id_sesion>/eegs
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        # Search for the session for the given ID
        sesion = Sesion.query.get_or_404(id_sesion)
        # Search for the EEGs associated with the session
        raw_eegs = RawEEG.query.filter_by(id_sesion=id_sesion).all()
        normalized_eegs = NormalizedEEG.query.filter_by(id_sesion=id_sesion).all()
        # Search for the medications associated with the session
        medicamentos = [medicamento.nombre_comercial for medicamento in sesion.medicamentos]
        eegs_response = {
            'detalle_sesion': {
                'id_sesion': sesion.id_sesion,
                'fecha_consulta': sesion.fecha_consulta.strftime('%Y-%m-%d'),
                'estado_general': sesion.estado_general,
                'estado_especifico': sesion.estado_especifico,
                'resumen_sesion_actual': sesion.resumen_sesion_actual,
                'notas_psicologo': sesion.notas_psicologo
            },
            'raw_eegs': [{
                'id_eeg': eeg.id_eeg,
                'fecha_hora_registro': eeg.fecha_hora_registro.strftime('%Y-%m-%d %H:%M:%S'),
                'data': eeg.data
            } for eeg in raw_eegs],
            'normalized_eegs': [{
                'id_eeg_procesado': eeg.id_eeg_procesado,
                'fecha_hora_procesado': eeg.fecha_hora_procesado.strftime('%Y-%m-%d %H:%M:%S'),
                'data_normalized': eeg.data_normalized,
                'data_psd': eeg.data_psd,
                'data_stft': eeg.data_stft
            } for eeg in normalized_eegs]
        }
        logging.info('Sesión y EEGs obtenidos exitosamente para la sesión %s', id_sesion)
        return jsonify(eegs_response), 200
    except Exception as e:
        logging.error('Error al obtener los EEGs de la sesión %s: %s', id_sesion, e)
        return jsonify({'error': 'Error al obtener los EEGs de la sesión'}), 500
    
def generar_datos_eeg(raw_eegs, normalized_eegs):
    yield '{"detalle_sesion": {...},'  # Envía la parte inicial de tu JSON
    yield '"raw_eegs": ['
    for eeg in raw_eegs:
        # Suponiendo que `eeg.data` es una cadena JSON de los datos EEG crudos
        yield json.dumps({
            'id_eeg': eeg.id_eeg,
            'fecha_hora_registro': eeg.fecha_hora_registro.strftime('%Y-%m-%d %H:%M:%S'),
            'data': eeg.data
        }) + ','
    yield '],'
    yield '"normalized_eegs": ['
    for eeg in normalized_eegs:
        # Similar a raw_eegs, pero con los datos normalizados
        yield json.dumps({
            'id_eeg_procesado': eeg.id_eeg_procesado,
            'fecha_hora_procesado': eeg.fecha_hora_procesado.strftime('%Y-%m-%d %H:%M:%S'),
            'data_normalized': eeg.data_normalized,
            'data_psd': eeg.data_psd,
            'data_stft': eeg.data_stft
        }) + ','
    yield ']}'


@app.route('/sesiones/<int:id_sesion>/paciente', methods=['GET'])
@jwt_required()   
def obtener_paciente_en_base_a_sesion(id_sesion):
    """
    Endpoint to retrieve the patient associated with a specific session.
    Requires a valid JWT access token.
    The function receives the session ID and returns the patient associated with that session.
    ·Parameters:
        id_sesion: int - The ID of the session for which the associated patient is being retrieved.
    ·Responses:
        200: If the patient was successfully retrieved. Returns the patient ID.
        404: If the session or patient was not found.
    ·Usage example:
        GET /sesiones/<id_sesion>/paciente
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    sesion = Sesion.query.get_or_404(id_sesion)
    paciente = Paciente.query.get_or_404(sesion.id_paciente)
    return jsonify(paciente.id_paciente), 200

@app.route('/sesiones/pacientes/<int:id_paciente>/sesiones/fechas', methods=['GET'])
@jwt_required()
#@cross_origin()
#@cross_origin(origins=['http://localhost:4200']) 
def obtener_fechas_sesiones_por_paciente(id_paciente):
    """
    Endpoint to retrieve all session dates for a specific patient.
    Requires a valid JWT access token.
    Lists dates of all sessions conducted for the patient, ordered by the date of the session.
    ·Parameters:
        id_paciente: int - The ID of the patient for whom the session dates are being retrieved.
    ·Responses:
        200: If the session dates were successfully retrieved. Returns a list of session IDs and dates.
        404: If the patient was not found.
        500: If an internal server error occurred.
    ·Usage example:
        GET /sesiones/pacientes/<id_paciente>/sesiones/fechas
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    try:
        # Making sure the patient exists
        paciente = Paciente.query.get_or_404(id_paciente)
        # Obtain all the sessions for the patient
        sesiones = Sesion.query.filter_by(id_paciente=id_paciente).order_by(Sesion.fecha_consulta.asc()).all()
        # Extract the dates of the sessions
        fechas_sesiones = [{
            'id_sesion': sesion.id_sesion,
            'fecha_consulta': sesion.fecha_consulta.strftime('%Y-%m-%d')
        } for sesion in sesiones]
        logging.info('Fechas de sesiones obtenidas exitosamente para el paciente %s', id_paciente)
        # Return the dates of the sessions as a JSON response
        return jsonify(fechas_sesiones), 200
    except Exception as e:
        logging.error('Error al obtener las fechas de las sesiones para el paciente %s: %s', id_paciente, e)
        return jsonify({'mensaje': 'Error interno del servidor'}), 500

@app.route('/sesiones/<int:id_sesion>/medicamentos', methods=['POST'])
@jwt_required()
def agregar_medicamentos_sesion(id_sesion):
    """
    Endpoint to add medications to a specific session.
    Requires a valid JWT access token.
    Allows adding one or more medications to the session without replacing existing ones.
    ·Parameters:
        id_sesion: int - The ID of the session.
        medicamentos_ids: list - The IDs of the medications to add.
    ·Responses:
        200: If the medications were successfully added.
        400: If the medication IDs were not provided, a medication was not found, or duplicate entries.
        404: If the session was not found.
        500: If an internal server error occurred.
    ·Usage example:
        POST /sesiones/1/medicamentos
        {
            "medicamentos_ids": [1, 2, 3]
        }
    """
    logging.info('Agregando medicamentos a la sesión %s', id_sesion)
    try:
        sesion = Sesion.query.get_or_404(id_sesion)
        datos = request.get_json()
        medicamentos_ids = datos.get('medicamentos_ids', [])
        if not medicamentos_ids:
            raise BadRequest('No se proporcionaron IDs de medicamentos')
        
        medicamentos_actuales = set(med.id_medicamento for med in sesion.medicamentos)
        
        for med_id in medicamentos_ids:
            if med_id in medicamentos_actuales:
                continue  # Ignora los duplicados dentro de la misma sesión
            medicamento = Medicamento.query.get(med_id)
            if not medicamento:
                raise BadRequest(f'No se encontró el medicamento con ID {med_id}')
            sesion.medicamentos.append(medicamento)
        
        db.session.commit()
        logging.info('Medicamentos agregados a la sesión %s exitosamente', id_sesion)
        return jsonify({'mensaje': 'Medicamentos agregados exitosamente'}), 200
    except BadRequest as e:
        db.session.rollback()
        logging.error('Error al procesar la solicitud: %s', str(e))
        return jsonify({'error': 'Error al procesar la solicitud: ' + str(e)}), 400
    except IntegrityError as e:
        db.session.rollback()
        logging.error('Error de integridad: %s', str(e))
        return jsonify({'error': 'Error de integridad: ' + str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logging.error('Error inesperado: %s', str(e))
        return jsonify({'error': 'Error inesperado: ' + str(e)}), 500

@app.route('/sesiones/<int:id_sesion>/medicamentos', methods=['PUT'])
@jwt_required()
def actualizar_medicamentos_sesion(id_sesion):
    """
    Endpoint to update the medications for a specific session.
    Requires a valid JWT access token.
    Validates the existence of the medications before updating. Clears the current medications and adds the new ones.
    ·Parameters:
        id_sesion: int - The ID of the session.
        medicamentos_ids: list - The IDs of the new medications.
    ·Responses:
        200: If the medications were successfully updated.
        400: If the medication IDs were not provided or a medication was not found.
        500: If an internal server error occurred.
    ·Usage example:
        PUT /sesiones/1/medicamentos
        {
            "medicamentos_ids": [1, 2, 3]
        }
    """
    logging.info('Actualizando medicamentos de la sesión %s', id_sesion)
    try:
        sesion = Sesion.query.get_or_404(id_sesion)
        datos = request.get_json()
        medicamentos_ids = datos.get('medicamentos_ids', [])
        if not medicamentos_ids:
            raise BadRequest('No se proporcionaron IDs de medicamentos')
        sesion.medicamentos.clear()
        for med_id in medicamentos_ids:
            medicamento = Medicamento.query.get(int(med_id))
            if not medicamento:
                raise BadRequest(f'No se encontró el medicamento con ID {med_id}')
            sesion.medicamentos.append(medicamento)
        db.session.commit()
        logging.info('Medicamentos de la sesión %s actualizados exitosamente', id_sesion)
        return jsonify({'mensaje': 'Medicamentos actualizados exitosamente'}), 200
    except BadRequest as e:
        db.session.rollback()
        logging.error('Error al procesar la solicitud: %s', str(e))
        return jsonify({'error': 'Error al procesar la solicitud: ' + str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logging.error('Error inesperado: %s', str(e))
        return jsonify({'error': 'Error inesperado: ' + str(e)}), 500

@app.route('/sesiones/<int:id_sesion>/notas_psicologo', methods=['PUT'])
@jwt_required()
def actualizar_notas_psicologo_sesion(id_sesion):
    """
    Endpoint to update the psychologist's notes for a specific session.
    Requires a valid JWT access token.
    Validates the existence of the notes before updating. Replaces the current notes with the new ones.
    ·Parameters:
        id_sesion: int - The ID of the session.
        notas_psicologo: str - The new notes from the psychologist.
    ·Responses:
        200: If the notes were successfully updated.
        400: If the notes were not provided.
        500: If an internal server error occurred.
    ·Usage example:
        PUT /sesiones/1/notas_psicologo
        {
            "notas_psicologo": "New notes from the psychologist."
        }
    """
    logging.info('Actualizando notas del psicólogo de la sesión %s', id_sesion)
    try:
        sesion = Sesion.query.get_or_404(id_sesion)
        datos = request.get_json()
        notas_psicologo = datos.get('notas_psicologo')
        if notas_psicologo is None:
            raise BadRequest('No se proporcionaron las notas del psicólogo')
        sesion.notas_psicologo = notas_psicologo
        db.session.commit()
        logging.info('Notas del psicólogo de la sesión %s actualizadas exitosamente', id_sesion)
        return jsonify({'mensaje': 'Notas del psicólogo actualizadas exitosamente'}), 200
    except BadRequest as e:
        db.session.rollback()
        logging.error('Error al procesar la solicitud: %s', str(e))
        return jsonify({'error': 'Error al procesar la solicitud: ' + str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logging.error('Error inesperado: %s', str(e))
        return jsonify({'error': 'Error inesperado: ' + str(e)}), 500

@app.route('/pacientes/<int:id_paciente>/sesiones/<int:id_sesion>', methods=['DELETE'])
@jwt_required()
def eliminar_sesion(id_paciente, id_sesion):
    """
    Endpoint to delete a specific session for a patient.
    Requires a valid JWT access token.
    Verifies the session's association with the patient before deletion. Removes the session and all related EEG data from the database.
    ·Parameters:
        id_paciente: int - The ID of the patient who owns the session record.
        id_sesion: int - The ID of the session to be deleted.
    ·Responses:
        200: If the session was successfully deleted. Returns a success message.
        403: If the session is not associated with the patient. Returns an error message.
        404: If the session or patient does not exist.
        500: If an internal server error occurred.
    ·Usage example:
        DELETE /pacientes/<id_paciente>/sesiones/<id_sesion>
        Headers: { "Authorization": "Bearer <JWT_ACCESS_TOKEN>" }
    """
    # Verify if the session exists and belongs to the patient
    sesion = Sesion.query.filter_by(id_paciente=id_paciente, id_sesion=id_sesion).first()
    if sesion is None:
        return jsonify({'error': 'La sesión no existe o no pertenece al paciente indicado.'}), 404
    try:
        # Delete the session and its related data
        db.session.delete(sesion)
        db.session.commit()
        logging.info('Sesión %s eliminada exitosamente para el paciente %s', id_sesion, id_paciente)
        return jsonify({'mensaje': 'Sesión eliminada exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        logging.error('Error al eliminar la sesión %s para el paciente %s: %s', id_sesion, id_paciente, e)
        return jsonify({'error': 'Error interno del servidor'}), 500
######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################### Errores #######################################################################
# Handle the 404 error
@app.errorhandler(Exception)
def handle_exception(error):
    return jsonify({'message': str(error)}), 500

# Initialize the Flask application
if __name__ == '__main__':
    app.run(debug=True)