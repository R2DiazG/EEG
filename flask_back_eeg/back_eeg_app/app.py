from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token
#from flask_bcrypt import Bcrypt # Importar la extensión Bcrypt para encriptar contraseñas de forma segura (hashing)
from dotenv import load_dotenv
import os

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
db = SQLAlchemy(app)
migrate = Migrate(app, db)
#bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Importar los modelos
from models import Usuario, Rol, Genero, EstadoCivil, Escolaridad, Lateralidad, Ocupacion, Paciente, Telefono, CorreoElectronico, Direccion, HistorialMedico, PacienteMedicamento, DiagnosticoPrevio, Sesion, Consentimiento, RawEEG, NormalizedEEG

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
    #hashed_password = bcrypt.generate_password_hash(datos['contraseña']).decode('utf-8')
    # Contraseña sin el bycrypt
    hashed_password = datos['contraseña']
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
        #usuario.contraseña = bcrypt.generate_password_hash(datos['contraseña']).decode('utf-8')
        # Contraseña sin el bcrypt
        usuario.contraseña = datos['contraseña']
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
@app.route('/pacientes', methods=['POST'])
def crear_paciente():
    datos = request.get_json()
    nuevo_paciente = Paciente(
        id_usuario=datos['id_usuario'],
        nombre=datos['nombre'],
        apellido_paterno=datos['apellido_paterno'],
        apellido_materno=datos['apellido_materno'],
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
            nuevo_telefono = Telefono(numero=num, id_paciente=nuevo_paciente.id_paciente)
            db.session.add(nuevo_telefono)
    if 'correos_electronicos' in datos:
        for email in datos['correos_electronicos']:
            nuevo_correo = CorreoElectronico(email=email, id_paciente=nuevo_paciente.id_paciente)
            db.session.add(nuevo_correo)
    if 'direcciones' in datos:
        for direccion in datos['direcciones']:
            nueva_direccion = Direccion(direccion=direccion, id_paciente=nuevo_paciente.id_paciente)
            db.session.add(nueva_direccion)
    db.session.commit()
    return jsonify({'mensaje': 'Paciente creado exitosamente'}), 201

@app.route('/pacientes', methods=['GET'])
def obtener_pacientes():
    pacientes = Paciente.query.all()
    resultado = []
    for paciente in pacientes:
        # Información básica del paciente
        paciente_datos = {
            'id_paciente': paciente.id_paciente,
            'id_usuario': paciente.id_usuario,
            'nombre': paciente.nombre,
            'apellido_paterno': paciente.apellido_paterno,
            'apellido_materno': paciente.apellido_materno,
            'fecha_nacimiento': paciente.fecha_nacimiento.strftime('%Y-%m-%d'),
            'id_genero': paciente.id_genero,
            'id_estado_civil': paciente.id_estado_civil,
            'id_escolaridad': paciente.id_escolaridad,
            'id_lateralidad': paciente.id_lateralidad,
            'id_ocupacion': paciente.id_ocupacion,
            # Agregar detalles relacionados
            'telefonos': [{'id_telefono': tel.id_telefono, 'telefono': tel.telefono} for tel in paciente.telefonos],
            'correos_electronicos': [{'id_correo': correo.id_correo, 'correo_electronico': correo.correo_electronico} for correo in paciente.correos_electronicos],
            'direcciones': [{
                'id_direccion': direccion.id_direccion,
                'calle_numero': direccion.calle_numero,
                'colonia': direccion.colonia,
                'ciudad': direccion.ciudad,
                'estado': direccion.estado,
                'pais': direccion.pais,
                'codigo_postal': direccion.codigo_postal
            } for direccion in paciente.direcciones]
        }
        resultado.append(paciente_datos)
    return jsonify(resultado), 200

@app.route('/pacientes/<int:id_paciente>', methods=['PUT'])
def actualizar_paciente(id_paciente):
    paciente = Paciente.query.get_or_404(id_paciente)
    datos = request.get_json()
    # Actualizar datos básicos del paciente
    paciente.nombre = datos.get('nombre', paciente.nombre)
    paciente.apellido_paterno = datos.get('apellido_paterno', paciente.apellido_paterno)
    paciente.apellido_materno = datos.get('apellido_materno', paciente.apellido_materno)
    paciente.fecha_nacimiento = datos.get('fecha_nacimiento', paciente.fecha_nacimiento)
    # Actualizar relaciones basadas en IDs proporcionados
    paciente.id_genero = datos.get('id_genero', paciente.id_genero)
    paciente.id_estado_civil = datos.get('id_estado_civil', paciente.id_estado_civil)
    paciente.id_escolaridad = datos.get('id_escolaridad', paciente.id_escolaridad)
    paciente.id_lateralidad = datos.get('id_lateralidad', paciente.id_lateralidad)
    paciente.id_ocupacion = datos.get('id_ocupacion', paciente.id_ocupacion)
    # Actualizar teléfonos
    actualizar_telefonos(paciente, datos.get('telefonos', []))
    # Actualizar correos electrónicos
    actualizar_correos(paciente, datos.get('correos_electronicos', []))
    # Actualizar direcciones
    actualizar_direcciones(paciente, datos.get('direcciones', []))
    db.session.commit()
    return jsonify({'mensaje': 'Paciente actualizado exitosamente'}), 200

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
    # Eliminar registros relacionados para mantener la integridad referencial
    Telefono.query.filter_by(id_paciente=id_paciente).delete()
    CorreoElectronico.query.filter_by(id_paciente=id_paciente).delete()
    Direccion.query.filter_by(id_paciente=id_paciente).delete()
    HistorialMedico.query.filter_by(id_paciente=id_paciente).delete()
    PacienteMedicamento.query.filter_by(id_paciente=id_paciente).delete()
    DiagnosticoPrevio.query.filter_by(id_paciente=id_paciente).delete()
    Sesion.query.filter_by(id_paciente=id_paciente).delete()
    Consentimiento.query.filter_by(id_paciente=id_paciente).delete()
    RawEEG.query.filter_by(id_paciente=id_paciente).delete()
    NormalizedEEG.query.filter_by(id_paciente=id_paciente).delete()
    # Una vez eliminados los registros relacionados, podemos proceder a eliminar el paciente
    db.session.delete(paciente)
    db.session.commit()
    return jsonify({'mensaje': 'Paciente eliminado exitosamente'}), 200
######################################################################################################################################################

# Manejador global de errores
@app.errorhandler(Exception)
def handle_exception(error):
    return jsonify({'message': str(error)}), 500

# Iniciar la aplicación
if __name__ == '__main__':
    app.run(debug=True)