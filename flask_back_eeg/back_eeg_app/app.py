from flask import Flask, jsonify, request
from extensions import db, migrate, jwt, bcrypt
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from datetime import datetime
import os
import mne
import numpy as np
import pandas as pd

# Cargar las variables de entorno
load_dotenv()

# Inicializar la aplicación Flask
app = Flask(__name__)

# Configurar la aplicación
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar las extensiones
db.init_app(app)
migrate.init_app(app, db)
jwt.init_app(app)
bcrypt.init_app(app)

# Importar los modelos
from models import Usuario, Rol, Genero, EstadoCivil, Escolaridad, Lateralidad, Ocupacion, Paciente, Telefono, CorreoElectronico, Direccion, HistorialMedico, paciente_medicamento, DiagnosticoPrevio, Sesion, Consentimiento, RawEEG, NormalizedEEG

# Ruta para verificar la salud de la aplicación
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'up'}), 200

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
    # Contraseña sin el bycrypt
    #hashed_password = datos['contraseña']
    nuevo_usuario = Usuario(
        nombre=datos.get('nombre'),
        apellidos=datos.get('apellidos'),
        username=datos.get('username'),
        contraseña=hashed_password,
        correo=datos.get('correo'),
        aprobacion=datos.get('aprobacion', True),  # Valor predeterminado a True si no se proporciona
        id_rol=datos.get('id_rol')
    )
    db.session.add(nuevo_usuario)
    db.session.commit()
    return jsonify({'mensaje': 'Usuario creado exitosamente'}), 201

@app.route('/usuarios', methods=['GET'])
def obtener_usuarios():
    usuarios = Usuario.query.all()
    resultado = [{
        'id_usuario': usuario.id_usuario,
        'nombre': usuario.nombre,
        'apellidos': usuario.apellidos,
        'username': usuario.username,
        'correo': usuario.correo,
        'aprobacion': usuario.aprobacion,
        'id_rol': usuario.id_rol
    } for usuario in usuarios]
    return jsonify(resultado), 200

@app.route('/usuarios/<int:id_usuario>', methods=['GET'])
def obtener_usuario(id_usuario):
    usuario = Usuario.query.get_or_404(id_usuario)
    usuario_datos = {
        'id_usuario': usuario.id_usuario,
        'nombre': usuario.nombre,
        'apellidos': usuario.apellidos,
        'username': usuario.username,
        'correo': usuario.correo,
        'aprobacion': usuario.aprobacion,
        'id_rol': usuario.id_rol
    }
    return jsonify(usuario_datos), 200

@app.route('/usuarios/<int:id_usuario>', methods=['PUT'])
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
        # Contraseña sin el bcrypt
        #usuario.contraseña = datos['contraseña']
    usuario.correo = datos.get('correo', usuario.correo)
    usuario.aprobacion = datos.get('aprobacion', usuario.aprobacion)
    db.session.commit()
    return jsonify({'mensaje': 'Usuario actualizado exitosamente'}), 200

@app.route('/usuarios/<int:id_usuario>', methods=['DELETE'])
def eliminar_usuario(id_usuario):
    usuario = Usuario.query.get_or_404(id_usuario)
    db.session.delete(usuario)
    db.session.commit()
    return jsonify({'mensaje': 'Usuario eliminado exitosamente'}), 200
######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################ CRUD de Pacientes ###################################################################
@app.route('/usuarios/<int:id_usuario>/pacientes', methods=['POST'])
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

@app.route('/pacientes', methods=['GET'])
def obtener_pacientes():
    pacientes = Paciente.query.all()
    resultado = []
    for paciente in pacientes:
        paciente_datos = {
            'id_paciente': paciente.id_paciente,
            'id_usuario': paciente.id_usuario,
            'nombre': paciente.nombre,
            'apellido_paterno': paciente.apellido_paterno,
            'apellido_materno': paciente.apellido_materno or "",
            'fecha_nacimiento': paciente.fecha_nacimiento.strftime('%Y-%m-%d') if paciente.fecha_nacimiento else "",
            'genero': paciente.genero.descripcion if paciente.genero else None,
            'estado_civil': paciente.estado_civil.descripcion if paciente.estado_civil else None,
            'escolaridad': paciente.escolaridad.descripcion if paciente.escolaridad else None,
            'lateralidad': paciente.lateralidad.descripcion if paciente.lateralidad else None,
            'ocupacion': paciente.ocupacion.descripcion if paciente.ocupacion else None,
        }
        resultado.append(paciente_datos)
    return jsonify(resultado), 200

@app.route('/pacientes/<int:id_paciente>/detalles', methods=['GET'])
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
        # Asumiendo paginación y limitación en el número de sesiones a mostrar
        'sesiones': obtener_sesiones_con_enlace_eeg(paciente.id_paciente)
    }
    # Incluir resumen de diagnósticos previos, consentimientos y medicamentos
    detalles_paciente.update({
        'diagnosticos_previos': [{'descripcion': diag.descripcion} for diag in paciente.diagnosticos_previos],
        'consentimientos': [{'consentimiento': consent.consentimiento, 'fecha_registro': consent.fecha_registro.strftime('%Y-%m-%d %H:%M:%S')} for consent in paciente.consentimientos],
        'medicamentos': [{'nombre_comercial': med.nombre_comercial} for med in paciente.medicamentos]
    })
    return jsonify(detalles_paciente), 200

def obtener_sesiones_con_enlace_eeg(id_paciente):
    limite = request.args.get('limit', default=10, type=int)  # Establecer un límite por defecto
    pagina = request.args.get('page', default=1, type=int)  # Establecer la página por defecto
    sesiones_paginadas = Sesion.query.filter_by(id_paciente=id_paciente).paginate(page=pagina, per_page=limite, error_out=False)
    sesiones = [{
        'id_sesion': sesion.id_sesion,
        'fecha_consulta': sesion.fecha_consulta.strftime('%Y-%m-%d'),
        'resumen_sesion_actual': sesion.resumen_sesion_actual,
        'notas_psicologo': sesion.notas_psicologo,
        'link_detalle_eeg': f"/sesiones/{sesion.id_sesion}/eegs"  # Proporcionar un enlace para obtener detalles de EEG por sesión
    } for sesion in sesiones_paginadas.items]
    return sesiones

@app.route('/sesiones/<int:id_sesion>/eegs', methods=['GET'])
def obtener_eegs_por_sesion(id_sesion):
    # Buscar la sesión por ID para asegurarse de que existe
    sesion = Sesion.query.get_or_404(id_sesion)
    # Buscar los EEGs asociados con la sesión
    raw_eegs = RawEEG.query.filter_by(id_sesion=id_sesion).all()
    normalized_eegs = NormalizedEEG.query.filter_by(id_sesion=id_sesion).all()
    # Preparar la respuesta con los datos de los EEGs
    eegs_response = {
        'raw_eegs': [{
            'id_eeg': eeg.id_eeg,
            'fecha_hora_registro': eeg.fecha_hora_registro.strftime('%Y-%m-%d %H:%M:%S'),
            'Fp1': eeg.Fp1,
            'F3': eeg.F3,
            'C3': eeg.C3,
            'P3': eeg.P3,
            'O1': eeg.O1,
            'F7': eeg.F7,
            'T3': eeg.T3,
            'T5': eeg.T5,
            'Fz': eeg.Fz,
            'Fp2': eeg.Fp2,
            'F4': eeg.F4,
            'C4': eeg.C4,
            'P4': eeg.P4,
            'O2': eeg.O2,
            'F8': eeg.F8,
            'T4': eeg.T4,
            'T6': eeg.T6,
            'Cz': eeg.Cz,
            'Pz': eeg.Pz
            # Incluye aquí más campos si son relevantes y los almacenas
        } for eeg in raw_eegs],
        'normalized_eegs': [{
            'id_eeg_procesado': eeg.id_eeg_procesado,
            'fecha_hora_procesado': eeg.fecha_hora_procesado.strftime('%Y-%m-%d %H:%M:%S'),
            'pointStart': eeg.pointStart,
            'pointInterval': eeg.pointInterval,
            'Fp1_normalized': eeg.Fp1,
            'F3_normalized': eeg.F3,
            'C3_normalized': eeg.C3,
            'P3_normalized': eeg.P3,
            'O1_normalized': eeg.O1,
            'F7_normalized': eeg.F7,
            'T3_normalized': eeg.T3,
            'T5_normalized': eeg.T5,
            'Fz_normalized': eeg.Fz,
            'Fp2_normalized': eeg.Fp2,
            'F4_normalized': eeg.F4,
            'C4_normalized': eeg.C4,
            'P4_normalized': eeg.P4,
            'O2_normalized': eeg.O2,
            'F8_normalized': eeg.F8,
            'T4_normalized': eeg.T4,
            'T6_normalized': eeg.T6,
            'Cz_normalized': eeg.Cz,
            'Pz_normalized': eeg.Pz
            # Añade más campos normalizados si son relevantes y los almacenas
        } for eeg in normalized_eegs]
    }
    return jsonify(eegs_response), 200

@app.route('/pacientes/<int:id_paciente>', methods=['PUT'])
def actualizar_paciente(id_paciente):
    paciente = Paciente.query.get_or_404(id_paciente)
    datos = request.get_json()
    try:
        # Actualizar datos básicos del paciente
        actualizar_datos_basicos_paciente(paciente, datos)
        # Actualizar relaciones
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
                telefono.numero = tel_data['numero']
            else:
                nuevo_telefono = Telefono(numero=tel_data['numero'], id_paciente=paciente.id_paciente)
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

@app.route('/pacientes/<int:id_paciente>', methods=['DELETE'])
def eliminar_paciente(id_paciente):
    paciente = Paciente.query.get_or_404(id_paciente)
    try:
        # Eliminar registros relacionados de manera secuencial para mantener la integridad referencial
        # Primero, elimina entidades directamente relacionadas con el paciente
        Telefono.query.filter_by(id_paciente=id_paciente).delete()
        CorreoElectronico.query.filter_by(id_paciente=id_paciente).delete()
        Direccion.query.filter_by(id_paciente=id_paciente).delete()
        HistorialMedico.query.filter_by(id_paciente=id_paciente).delete()
        paciente_medicamento.query.filter_by(id_paciente=id_paciente).delete()
        DiagnosticoPrevio.query.filter_by(id_paciente=id_paciente).delete()
        Consentimiento.query.filter_by(id_paciente=id_paciente).delete()
        # Luego, encuentra todas las sesiones asociadas con el paciente para eliminar registros relacionados
        sesiones = Sesion.query.filter_by(id_paciente=id_paciente).all()
        for sesion in sesiones:
            RawEEG.query.filter_by(id_sesion=sesion.id_sesion).delete()
            NormalizedEEG.query.filter_by(id_sesion=sesion.id_sesion).delete()  # Asumiendo que NormalizedEEG está vinculado a la sesión
            # Elimina la sesión después de eliminar los EEGs asociados
            db.session.delete(sesion)
        # Finalmente, eliminar el paciente
        db.session.delete(paciente)
        db.session.commit()
        return jsonify({'mensaje': 'Paciente eliminado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al eliminar el paciente: {}'.format(str(e))}), 500
######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################ Procesamiento de EEG ################################################################
# INCOMPLETO – Falta trabajar en varias partes de este código, no va a funcionar tal como está
@app.route('/pacientes/<int:id_paciente>/subir_eeg', methods=['POST'])
def subir_eeg(id_paciente):
    # Asegurar que el archivo está presente en la petición
    if 'archivo_eeg' not in request.files:
        return jsonify({'error': 'No se encontró el archivo'}), 400
    archivo_eeg = request.files['archivo_eeg']
    if archivo_eeg.filename == '':
        return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
    # Guardar el archivo temporalmente
    path_temporal = os.path.join('/tmp', archivo_eeg.filename)
    archivo_eeg.save(path_temporal)
    def renombrar_canales(ch_names):
        nuevos_nombres = []
        for ch in ch_names:
            nuevo_nombre = ch.replace('-A1', '')
            if len(nuevo_nombre) > 1 and nuevo_nombre[1].isalpha():
                nuevo_nombre = nuevo_nombre[0] + nuevo_nombre[1].lower() + nuevo_nombre[2:]
            nuevos_nombres.append(nuevo_nombre)
        return nuevos_nombres
    try:
        # Cargar el archivo .edf
        raw = mne.io.read_raw_edf(path_temporal, preload=True)
        # Renombrar los canales para coincidir con los del modelo
        nuevos_nombres = renombrar_canales(raw.ch_names)
        raw.rename_channels({old: new for old, new in zip(raw.ch_names, nuevos_nombres)})
        # Crear una nueva sesión
        nueva_sesion = Sesion(
            id_paciente=id_paciente,
            fecha_consulta=datetime.utcnow(),
            resumen_sesion_actual="Resumen de la sesión",
            notas_psicologo="Notas del psicólogo"
        )
        db.session.add(nueva_sesion)
        db.session.flush()
        # Cargar los datos raw a la base de datos
        for ch_name in nuevos_nombres:
            ch_index = nuevos_nombres.index(ch_name)
            ch_data = raw.get_data(picks=[ch_index])
            nuevo_raw_eeg = RawEEG(
                id_sesion=nueva_sesion.id_sesion,
                fecha_hora_registro=datetime.utcnow(),
                **{ch_name: ch_data.mean()}  # Ejemplo de cómo almacenar un valor representativo por canal
            )
            db.session.add(nuevo_raw_eeg)
        db.session.commit()  # Guardar los datos raw
        # Ahora filtramos y procesamos los datos para NormalizedEEG
        raw.filter(1., 40., fir_design='firwin')
        psds, freqs = mne.time_frequency.psd_welch(raw, fmin=1, fmax=40, n_fft=2048)
        # Supongamos que solo almacenamos el PSD promedio para cada canal en NormalizedEEG
        for ch_name in nuevos_nombres:
            ch_index = nuevos_nombres.index(ch_name)
            psd_data = psds[ch_index, :].mean()
            nuevo_normalized_eeg = NormalizedEEG(
                id_sesion=nueva_sesion.id_sesion,
                fecha_hora_procesado=datetime.utcnow(),
                **{ch_name: psd_data}  # Ejemplo 
            )
            db.session.add(nuevo_normalized_eeg)
        db.session.commit()
        return jsonify({'mensaje': 'Archivo EEG procesado y datos almacenados exitosamente', 'id_sesion': nueva_sesion.id_sesion}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
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