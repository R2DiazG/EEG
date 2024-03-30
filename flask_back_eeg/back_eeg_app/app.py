from flask import Flask, jsonify, request, url_for
from flask_cors import CORS
from extensions import db, migrate, jwt, bcrypt
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from sqlalchemy import delete
from flask_mail import Mail, Message
from mne.preprocessing import ICA
import os
import mne
import json
import numpy as np
import pandas as pd

# Cargar las variables de entorno
load_dotenv()

# Inicializar la aplicación Flask
app = Flask(__name__)
CORS(app)

# Configurar la aplicación
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

# Inicializar URLSafeTimedSerializer con la TOKEN_SECRET_KEY
s = URLSafeTimedSerializer(token_secret_key)

# Inicializar las extensiones
db.init_app(app)
migrate.init_app(app, db)
bcrypt.init_app(app)
jwt = JWTManager(app)
mail = Mail(app)

# Importar los modelos
from models import Usuario, Rol, Genero, EstadoCivil, Escolaridad, Lateralidad, Ocupacion, Paciente, Telefono, CorreoElectronico, Direccion, HistorialMedico, sesion_medicamento, DiagnosticoPrevio, Sesion, Consentimiento, RawEEG, NormalizedEEG, Medicamento

# Ruta para verificar la salud de la aplicación
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'up'}), 200

######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
############################################################# Autenticación de Usuarios ##############################################################
@app.route('/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({"msg": "Falta el JSON en la solicitud"}), 400
    username = request.json.get('username', None)
    password = request.json.get('contraseña', None)
    if not username:
        return jsonify({"msg": "Falta el username"}), 400
    if not password:
        return jsonify({"msg": "Falta la contraseña"}), 400
    # Verificar credenciales del usuario en la base de datos
    user = Usuario.query.filter_by(username=username).first()
    # Verificar si el usuario existe y la contraseña es correcta
    if user and bcrypt.check_password_hash(user.contraseña, password):
        # Adicionalmente, verificar si el usuario está aprobado
        if not user.aprobacion:
            return jsonify({"msg": "Usuario no aprobado. Por favor, espera a que un administrador apruebe tu cuenta."}), 403
        # Crear el token de acceso JWT para usuarios aprobados
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"msg": "Credenciales incorrectas"}), 401

@app.route('/solicitar_cambio_contrasena', methods=['POST'])
def solicitar_cambio_contrasena():
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
        return jsonify({"msg": "Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña."}), 200
    except Exception as e:
        return jsonify({"msg": "Ocurrió el error: " + str(e)}), 500

@app.route('/resetear_contrasena/<token>', methods=['POST'])
def resetear_contraseña(token):
    try:
        datos = request.get_json()
        nueva_contrasena = datos.get('nueva_contrasena', None)
        correo = s.loads(token, salt='cambio-contrasena', max_age=3600)  # 3600 segundos = 1 hora
        usuario = Usuario.query.filter_by(correo=correo).first()
        if usuario:
            hashed_password = bcrypt.generate_password_hash(nueva_contrasena).decode('utf-8')
            usuario.contraseña = hashed_password
            db.session.commit()
            return jsonify({"msg": "Tu contraseña ha sido actualizada."}), 200
        else:
            return jsonify({"msg": "Usuario no encontrado."}), 404
    except SignatureExpired:
        return jsonify({"msg": "El enlace para restablecer la contraseña ha expirado."}), 400
    except BadSignature:
        return jsonify({"msg": "Enlace inválido."}), 400
    
@app.route('/usuario/actual', methods=['GET'])
@jwt_required()
def obtener_usuario_actual():
    # Obtener la identidad del token JWT
    identidad_usuario = get_jwt_identity()
    # Buscar al usuario por su identidad (por ejemplo, su username)
    usuario_actual = Usuario.query.filter_by(username=identidad_usuario).first()
    if usuario_actual:
        # Retornar el nombre y apellidos del usuario
        return jsonify({
            'id_usuario': usuario_actual.id_usuario,
            'nombre': usuario_actual.nombre,
            'apellidos': usuario_actual.apellidos,
            'id_rol': usuario_actual.id_rol
        }), 200
    else:
        return jsonify({'mensaje': 'Usuario no encontrado'}), 404

######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################## CRUD de Usuarios ##################################################################
@app.route('/usuarios', methods=['POST'])
def crear_usuario():
    datos = request.get_json()
    if not datos or 'username' not in datos or 'contraseña' not in datos:
        return jsonify({'mensaje': 'Datos insuficientes para crear un usuario'}), 400
    # Verificar la existencia del rol
    rol = Rol.query.get(datos.get('id_rol'))
    if not rol:
        return jsonify({'mensaje': 'Rol no válido'}), 400
    hashed_password = bcrypt.generate_password_hash(datos['contraseña']).decode('utf-8')
    nuevo_usuario = Usuario(
        nombre=datos.get('nombre'),
        apellidos=datos.get('apellidos'),
        username=datos.get('username'),
        contraseña=hashed_password,
        correo=datos.get('correo'),
        aprobacion=datos.get('aprobacion', False),  # Valor predeterminado a False si no se proporciona
        id_rol=datos.get('id_rol')
    )
    db.session.add(nuevo_usuario)
    db.session.commit()
    return jsonify({'mensaje': 'Usuario creado exitosamente'}), 201

@app.route('/usuarios', methods=['GET'])
@jwt_required()
def obtener_usuarios():
    current_user = get_jwt_identity()
    usuario_actual = Usuario.query.filter_by(username=current_user).first()
    if usuario_actual.id_rol != 1: 
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
            # No se incluye la contraseña
        } for usuario in usuarios
    ]
    return jsonify(resultado), 200

@app.route('/usuarios/<int:id_usuario>', methods=['GET'])
@jwt_required()
def obtener_usuario(id_usuario):
    current_user = get_jwt_identity()
    usuario_actual = Usuario.query.filter_by(username=current_user).first()
    if usuario_actual.id_rol != 1:
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
        # No se incluye la contraseña
    }
    return jsonify(usuario_datos), 200

@app.route('/usuarios/<int:id_usuario>', methods=['PUT'])
@jwt_required()
def actualizar_usuario(id_usuario):
    usuario = Usuario.query.get_or_404(id_usuario)
    datos = request.get_json()
    if 'id_rol' in datos:
        rol = Rol.query.get(datos['id_rol'])
        if not rol:
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
    return jsonify({'mensaje': 'Usuario actualizado exitosamente'}), 200

@app.route('/usuarios/<int:id_usuario>/aprobacion', methods=['PUT'])
@jwt_required()
def cambiar_aprobacion_usuario(id_usuario):
    datos = request.get_json()
    usuario = Usuario.query.get_or_404(id_usuario)
    # Se asume que el campo 'aprobacion' se envía en el cuerpo de la solicitud, y debe ser un valor booleano.
    if 'aprobacion' in datos and isinstance(datos['aprobacion'], bool):
        usuario.aprobacion = datos['aprobacion']
        db.session.commit()
        return jsonify({'mensaje': 'Estado de aprobación actualizado exitosamente'}), 200
    else:
        return jsonify({'error': 'Falta el campo de aprobación o el valor no es válido'}), 400

@app.route('/usuarios/<int:id_usuario>', methods=['DELETE'])
@jwt_required()
def eliminar_usuario(id_usuario):
    usuario = Usuario.query.get_or_404(id_usuario)
    db.session.delete(usuario)
    db.session.commit()
    return jsonify({'mensaje': 'Usuario eliminado exitosamente'}), 200
######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################ CRUD de Medicamentos ################################################################
@app.route('/medicamentos', methods=['POST'])
@jwt_required()
def crear_medicamento():
    datos = request.get_json()
    nombre_comercial = datos.get('nombre_comercial')
    principio_activo = datos.get('principio_activo')
    presentacion = datos.get('presentacion')
    if not nombre_comercial or not principio_activo or not presentacion:
        return jsonify({'mensaje': 'Faltan datos necesarios para crear el medicamento'}), 400
    nuevo_medicamento = Medicamento(nombre_comercial=nombre_comercial, principio_activo=principio_activo, presentacion=presentacion)
    db.session.add(nuevo_medicamento)
    db.session.commit()

@app.route('/medicamentos', methods=['GET'])
@jwt_required()
def obtener_medicamentos():
    medicamentos = Medicamento.query.all()
    resultado = [{
        'id_medicamento': medicamento.id_medicamento,
        'nombre_comercial': medicamento.nombre_comercial,
        'principio_activo': medicamento.principio_activo,
        'presentacion': medicamento.presentacion
    } for medicamento in medicamentos]
    return jsonify(resultado), 200

@app.route('/medicamentos/<int:id_medicamento>', methods=['GET'])
@jwt_required()
def obtener_medicamento_por_id(id_medicamento):
    medicamento = Medicamento.query.get_or_404(id_medicamento)
    return jsonify({
        'id_medicamento': medicamento.id_medicamento,
        'nombre_comercial': medicamento.nombre_comercial,
        'principio_activo': medicamento.principio_activo,
        'presentacion': medicamento.presentacion
    }), 200

@app.route('/medicamentos/<int:id_medicamento>', methods=['PUT'])
@jwt_required()
def actualizar_medicamento(id_medicamento):
    medicamento = Medicamento.query.get_or_404(id_medicamento)
    datos = request.get_json()
    medicamento.nombre_comercial = datos.get('nombre_comercial', medicamento.nombre_comercial)
    medicamento.principio_activo = datos.get('principio_activo', medicamento.principio_activo)
    medicamento.presentacion = datos.get('presentacion', medicamento.presentacion)
    db.session.commit()
    return jsonify({'mensaje': 'Medicamento actualizado exitosamente'}), 200

@app.route('/medicamentos/<int:id_medicamento>', methods=['DELETE'])
@jwt_required()
def eliminar_medicamento(id_medicamento):
    medicamento = Medicamento.query.get_or_404(id_medicamento)
    db.session.delete(medicamento)
    db.session.commit()
    return jsonify({'mensaje': 'Medicamento eliminado exitosamente'}), 200

######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################ CRUD de Pacientes ###################################################################
@app.route('/usuarios/<int:id_usuario>/pacientes', methods=['POST'])
@jwt_required()
def crear_paciente_para_usuario(id_usuario):
    # Verificar que el usuario existe
    usuario = Usuario.query.get_or_404(id_usuario)
    datos = request.get_json()
    try:
        nuevo_paciente = Paciente(
            id_usuario=id_usuario,  # Usamos el id_usuario de la ruta
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
        db.session.flush()  # Para obtener el id del paciente recién creado
        # Añadir teléfonos, correos electrónicos y direcciones si se proporcionan
        if 'telefonos' in datos:
            for num in datos['telefonos']:
                nuevo_telefono = Telefono(telefono=num, id_paciente=nuevo_paciente.id_paciente)
                db.session.add(nuevo_telefono)
        if 'correos_electronicos' in datos:
            for email in datos['correos_electronicos']:
                nuevo_correo = CorreoElectronico(correo_electronico=email, id_paciente=nuevo_paciente.id_paciente)
                db.session.add(nuevo_correo)
        if 'direcciones' in datos:
            for direccion in datos['direcciones']:
                nueva_direccion = Direccion(**direccion, id_paciente=nuevo_paciente.id_paciente)
                db.session.add(nueva_direccion)
        db.session.commit()
        return jsonify({'mensaje': 'Paciente creado exitosamente', 'id': nuevo_paciente.id_paciente}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/usuarios/<int:id_usuario>/pacientes', methods=['GET'])
@jwt_required()
def obtener_pacientes_por_usuario(id_usuario):
    pacientes = Paciente.query.filter_by(id_usuario=id_usuario).all()
    resultado = []
    for paciente in pacientes:
        # Calculamos la edad del paciente
        today = datetime.today()
        edad = today.year - paciente.fecha_nacimiento.year - ((today.month, today.day) < (paciente.fecha_nacimiento.month, paciente.fecha_nacimiento.day))
        # Obtenemos el número de sesiones
        sesiones = paciente.sesiones.order_by(Sesion.fecha_consulta.desc()).all() # Ordenamos las sesiones por fecha en orden descendente
        numero_de_sesiones = len(sesiones)
        # Obtenemos las notas del psicólogo de la última sesión, si existe
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
    return jsonify(resultado), 200

@app.route('/pacientes/<int:id_paciente>/detalles', methods=['GET'])
@jwt_required()
def obtener_detalles_paciente(id_paciente):
    paciente = Paciente.query.get_or_404(id_paciente)
    detalles_paciente = {
        'id_paciente': paciente.id_paciente,
        'nombre': paciente.nombre,
        'apellido_paterno': paciente.apellido_paterno,
        'apellido_materno': paciente.apellido_materno or "",
        'fecha_nacimiento': paciente.fecha_nacimiento.strftime('%Y-%m-%d'),
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
    }
    return jsonify(detalles_paciente), 200

@app.route('/sesiones/<int:id_sesion>/eegs', methods=['GET'])
@jwt_required()
def obtener_eegs_por_sesion(id_sesion):
    # Buscar la sesión por ID para asegurarse de que existe
    sesion = Sesion.query.get_or_404(id_sesion)
    # Buscar los EEGs asociados con la sesión
    raw_eegs = RawEEG.query.filter_by(id_sesion=id_sesion).all()
    normalized_eegs = NormalizedEEG.query.filter_by(id_sesion=id_sesion).all()
    # Buscar los medicamentos asociados con la sesión
    medicamentos = [medicamento.nombre_comercial for medicamento in sesion.medicamentos]
    eegs_response = {
        'detalle_sesion': {
            'id_sesion': sesion.id_sesion,
            'fecha_consulta': sesion.fecha_consulta.strftime('%Y-%m-%d')
        },
        'raw_eegs': [{
            'id_eeg': eeg.id_eeg,
            'fecha_hora_registro': eeg.fecha_hora_registro.strftime('%Y-%m-%d %H:%M:%S'),
            'data': eeg.data
        } for eeg in raw_eegs],
        'normalized_eegs': [{
            'id_eeg_procesado': eeg.id_eeg_procesado,
            'fecha_hora_procesado': eeg.fecha_hora_procesado.strftime('%Y-%m-%d %H:%M:%S'),
            'data_normalized': eeg.data_normalized
        } for eeg in normalized_eegs]
    }
    return jsonify(eegs_response), 200

@app.route('/pacientes/<int:id_paciente>/sesiones/fechas', methods=['GET'])
@jwt_required()
def obtener_fechas_sesiones_por_paciente(id_paciente):
    # Asegurarse de que el paciente existe
    paciente = Paciente.query.get_or_404(id_paciente)
    # Obtener todas las fechas de sesiones para el paciente especificado
    sesiones = Sesion.query.filter_by(id_paciente=id_paciente).order_by(Sesion.fecha_consulta.asc()).all()
    # Extraer solo las fechas de las sesiones para el dropdown list
    fechas_sesiones = [{
        'id_sesion': sesion.id_sesion,
        'fecha_consulta': sesion.fecha_consulta.strftime('%Y-%m-%d')
    } for sesion in sesiones]
    # Devolver las fechas de las sesiones en formato JSON
    return jsonify(fechas_sesiones), 200

@app.route('/pacientes/<int:id_paciente>/medicamentos', methods=['GET'])
@jwt_required()
def obtener_medicamentos_por_paciente(id_paciente):
    # Asegurarse de que el paciente existe
    paciente = Paciente.query.get_or_404(id_paciente)
    # Obtener todas las sesiones del paciente
    sesiones = Sesion.query.filter_by(id_paciente=id_paciente).all()
    # Lista para almacenar los medicamentos junto con la fecha de la sesión y notas del psicólogo
    medicamentos_detalle = []
    # Recorrer todas las sesiones para recolectar los medicamentos y las notas del psicólogo
    for sesion in sesiones:
        fecha_sesion = sesion.fecha_consulta.strftime('%Y-%m-%d')
        notas_psicologo = sesion.notas_psicologo
        for medicamento in sesion.medicamentos:
            medicamentos_detalle.append({
                'id_medicamento': medicamento.id_medicamento,
                'nombre_comercial': medicamento.nombre_comercial,
                'principio_activo': medicamento.principio_activo,
                'presentacion': medicamento.presentacion,
                'fecha_sesion': fecha_sesion,  # Incluir la fecha de la sesión
                'notas_psicologo': notas_psicologo  # Incluir las notas del psicólogo
            })
    return jsonify(medicamentos_detalle), 200

@app.route('/usuarios/<int:id_usuario>/pacientes/<int:id_paciente>', methods=['PUT'])
@jwt_required()
def actualizar_paciente_de_usuario(id_usuario, id_paciente):
    # Verificar si el paciente pertenece al usuario
    paciente = Paciente.query.filter_by(id_usuario=id_usuario, id_paciente=id_paciente).first()
    if paciente is None:
        return jsonify({'error': 'Paciente no encontrado o no pertenece al usuario indicado'}), 404
    datos = request.get_json()
    try:
        actualizar_datos_basicos_paciente(paciente, datos)
        # Actualizar relaciones (teléfonos, correos electrónicos, direcciones)
        actualizar_telefonos(paciente, datos.get('telefonos', []))
        actualizar_correos(paciente, datos.get('correos_electronicos', []))
        actualizar_direcciones(paciente, datos.get('direcciones', []))
        db.session.commit()
        return jsonify({'mensaje': 'Paciente actualizado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al actualizar el paciente: {}'.format(str(e))}), 400

def actualizar_datos_basicos_paciente(paciente, datos):
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
    if telefonos_nuevos is not None:
        # Obtener los teléfonos actuales y mapearlos por id_telefono
        telefonos_actuales = {tel.id_telefono: tel for tel in paciente.telefonos}
        for tel_data in telefonos_nuevos:
            if 'id_telefono' in tel_data and tel_data['id_telefono'] in telefonos_actuales:
                telefono = telefonos_actuales.pop(tel_data['id_telefono'])
                telefono.telefono = tel_data['numero']  # Cambio aquí
            else:
                nuevo_telefono = Telefono(telefono=tel_data['numero'], id_paciente=paciente.id_paciente)  # Y aquí
                db.session.add(nuevo_telefono)
        # Eliminar cualquier teléfono no incluido en la actualización
        for tel in telefonos_actuales.values():
            db.session.delete(tel)

def actualizar_correos(paciente, correos_nuevos):
    if correos_nuevos is not None:
        correos_actuales = {correo.id_correo: correo for correo in paciente.correos_electronicos}
        for correo_data in correos_nuevos:
            if 'id_correo' in correo_data and correo_data['id_correo'] in correos_actuales:
                correo = correos_actuales.pop(correo_data['id_correo'])
                correo.correo_electronico = correo_data['correo_electronico']
            else:
                nuevo_correo = CorreoElectronico(correo_electronico=correo_data['correo_electronico'], id_paciente=paciente.id_paciente)
                db.session.add(nuevo_correo)
        for correo in correos_actuales.values():
            db.session.delete(correo)

def actualizar_direcciones(paciente, direcciones_nuevas):
    if direcciones_nuevas is not None:
        direcciones_actuales = {direccion.id_direccion: direccion for direccion in paciente.direcciones}
        for direccion_data in direcciones_nuevas:
            if 'id_direccion' in direccion_data and direccion_data['id_direccion'] in direcciones_actuales:
                direccion = direcciones_actuales.pop(direccion_data['id_direccion'])
                # Actualiza los campos de la dirección aquí
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

@app.route('/usuarios/<int:id_usuario>/pacientes/<int:id_paciente>', methods=['DELETE'])
@jwt_required()
def eliminar_paciente(id_usuario, id_paciente):
    paciente = Paciente.query.get_or_404(id_paciente)
    if paciente.id_usuario != id_usuario:
        return jsonify({'error': 'Operación no permitida. Este paciente no pertenece al usuario.'}), 403
    try:
        sesiones = Sesion.query.filter_by(id_paciente=id_paciente).all()
        for sesion in sesiones:
            sesion.medicamentos = []
            # Asegurarte de eliminar o desvincular cualquier otro dato dependiente aquí
        # En vez de llamar a delete() directamente en la consulta, hazlo a través de un bucle para controlar mejor el proceso
        for sesion in sesiones:
            db.session.delete(sesion)
        # Ahora puedes continuar con la eliminación de otros registros relacionados
        Telefono.query.filter_by(id_paciente=id_paciente).delete()
        CorreoElectronico.query.filter_by(id_paciente=id_paciente).delete()
        Direccion.query.filter_by(id_paciente=id_paciente).delete()
        HistorialMedico.query.filter_by(id_paciente=id_paciente).delete()
        DiagnosticoPrevio.query.filter_by(id_paciente=id_paciente).delete()
        Consentimiento.query.filter_by(id_paciente=id_paciente).delete()
        db.session.delete(paciente)
        db.session.commit()
        return jsonify({'mensaje': 'Paciente eliminado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al eliminar el paciente: ' + str(e)}), 500

######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################ Procesamiento de EEG ################################################################
# INCOMPLETO – Falta trabajar en varias partes de este código, no va a funcionar tal como está
@app.route('/sesiones/nueva', methods=['POST'])
@jwt_required()
def crear_nueva_sesion():
    try:
        if 'archivo_eeg' not in request.files:
            return jsonify({'error': 'No se encontró el archivo'}), 400
        archivo_eeg = request.files['archivo_eeg']
        if archivo_eeg.filename == '':
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        datos = request.form
        id_paciente = datos.get('id_paciente')
        estado_general = datos.get('estado_general')
        estado_especifico = datos.getlist('estado_especifico')  # Asumiendo que es posible seleccionar más de uno
        resumen_sesion_actual = datos.get('resumen_sesion_actual')
        medicamentos_ids = datos.getlist('medicamentos_ids')  # Asume que recibes IDs de medicamentos como una lista
        # Guardar temporalmente y procesar archivo EEG
        path_temporal = os.path.join('/tmp', archivo_eeg.filename)
        archivo_eeg.save(path_temporal)
        # Crea una instancia de Sesion con los datos recibidos
        nueva_sesion = Sesion(
            id_paciente=id_paciente,
            fecha_consulta=datetime.now(timezone.utc),
            estado_general=estado_general,
            estado_especifico=','.join(estado_especifico),
            resumen_sesion_actual=resumen_sesion_actual,
            notas_psicologo=''  # Si tienes un campo para esto en tu formulario, cámbialo acorde
        )
        db.session.add(nueva_sesion)
        db.session.flush()  # Para obtener el ID de la nueva sesión antes de commit
        # Asocia medicamentos a la sesión
        for med_id in medicamentos_ids:
            medicamento = Medicamento.query.get(int(med_id))
            if medicamento:
                nueva_sesion.medicamentos.append(medicamento)
        def renombrar_canales(ch_names):
            nuevos_nombres = []
            for ch in ch_names:
                nuevo_nombre = ch.replace('-A1', '')
                if len(nuevo_nombre) > 1 and nuevo_nombre[1].isalpha():
                    nuevo_nombre = nuevo_nombre[0] + nuevo_nombre[1].lower() + nuevo_nombre[2:]
                nuevos_nombres.append(nuevo_nombre)
            return nuevos_nombres
        try:
            # Leer el archivo .edf
            raw = mne.io.read_raw_edf(path_temporal, preload=True)
            os.remove(path_temporal)  # Eliminar archivo temporal
            # Renombrar canales
            nuevos_nombres = renombrar_canales(raw.ch_names)
            raw.rename_channels({old: new for old, new in zip(raw.ch_names, nuevos_nombres)})
            
            # Filtrado Notch para eliminar frecuencias de la línea eléctrica (50-60Hz)
            raw.notch_filter(np.arange(50, 251, 50), fir_design='firwin')
            # Filtrado pasa-banda para conservar solo las frecuencias de interés
            raw.filter(1., 40., fir_design='firwin')
            # ICA para identificar y remover componentes de artefactos
            ica = ICA(n_components=20, random_state=97, max_iter=800)
            ica.fit(raw)
            ica.apply(raw)  # Asumiendo que ya identificaste los componentes a excluir antes de esta línea
            # Convertir datos EEG a JSON para almacenar en RawEEG
            datos_eeg_json = json.dumps(raw.get_data().tolist())
            nuevo_raw_eeg = RawEEG(id_sesion=nueva_sesion.id_sesion, fecha_hora_registro=datetime.utcnow(), data=datos_eeg_json)
            db.session.add(nuevo_raw_eeg)
            # En este punto, los datos ya están filtrados y limpios, por lo que procedemos a guardarlos para NormalizedEEG
            datos_procesados_json = json.dumps(raw.get_data().tolist())  # Datos después de ICA y filtrado Notch
            nuevo_normalized_eeg = NormalizedEEG(id_sesion=nueva_sesion.id_sesion, fecha_hora_procesado=datetime.utcnow(), data_normalized=datos_procesados_json)
            db.session.add(nuevo_normalized_eeg)
        except Exception as e:
            # Manejo de errores específicos del procesamiento EEG
            print(f"Error durante el procesamiento del EEG: {e}")
        db.session.commit()
        return jsonify({'mensaje': 'Sesión y datos de EEG procesados y almacenados exitosamente', 'id_sesion': nueva_sesion.id_sesion}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al procesar la solicitud: ' + str(e)}), 500
    finally:
        # Asegurarse de eliminar el archivo temporal
        if os.path.exists(path_temporal):
            os.remove(path_temporal)
######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#


# Manejador global de errores
@app.errorhandler(Exception)
def handle_exception(error):
    return jsonify({'message': str(error)}), 500

# Iniciar la aplicación
if __name__ == '__main__':
    app.run(debug=True)