from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token
from flask_bcrypt import Bcrypt
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
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Importar los modelos
from models import Usuario, Rol, Genero, EstadoCivil, Escolaridad, Lateralidad, Ocupacion, Paciente, Telefono, CorreoElectronico, Direccion

# Ruta para verificar la salud de la aplicación
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'up'}), 200

# Rutas de la API (ejemplo para registro y autenticación)

################################################################## CRUD de Usuarios ##################################################################
@app.route('/usuarios', methods=['POST'])
def crear_usuario():
    datos = request.get_json()
    nuevo_usuario = Usuario(
        nombre=datos['nombre'],
        apellidos=datos['apellidos'],
        username=datos['username'],
        contraseña=bcrypt.generate_password_hash(datos['contraseña']).decode('utf-8'),
        correo=datos['correo'],
        aprobacion=datos['aprobacion'],
        id_rol=datos['id_rol']
    )
    db.session.add(nuevo_usuario)
    db.session.commit()
    return jsonify({'mensaje': 'Usuario creado exitosamente'}), 201

@app.route('/usuarios', methods=['GET'])
def obtener_usuarios():
    usuarios = Usuario.query.all()
    resultado = []
    for usuario in usuarios:
        usuario_datos = {
            'id_usuario': usuario.id_usuario,
            'nombre': usuario.nombre,
            'apellidos': usuario.apellidos,
            'username': usuario.username,
            # No retornar la contraseña
            'correo': usuario.correo,
            'aprobacion': usuario.aprobacion,
            'id_rol': usuario.id_rol
        }
        resultado.append(usuario_datos)
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
    
    usuario.nombre = datos.get('nombre', usuario.nombre)
    usuario.apellidos = datos.get('apellidos', usuario.apellidos)
    usuario.username = datos.get('username', usuario.username)
    # No actualizar la contraseña directamente sin hashing
    if 'contraseña' in datos:
        usuario.contraseña = bcrypt.generate_password_hash(datos['contraseña']).decode('utf-8')
    usuario.correo = datos.get('correo', usuario.correo)
    usuario.aprobacion = datos.get('aprobacion', usuario.aprobacion)
    usuario.id_rol = datos.get('id_rol', usuario.id_rol)

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
################################################################### CRUD de Roles ####################################################################
@app.route('/roles', methods=['POST'])
def crear_rol():
    datos = request.get_json()
    nuevo_rol = Rol(rol=datos['rol'], descripcion=datos['descripcion'])
    db.session.add(nuevo_rol)
    db.session.commit()
    return jsonify({'mensaje': 'Rol creado exitosamente'}), 201

@app.route('/roles', methods=['GET'])
def obtener_roles():
    roles = Rol.query.all()
    resultado = [{'id_rol': rol.id_rol, 'rol': rol.rol, 'descripcion': rol.descripcion} for rol in roles]
    return jsonify(resultado), 200

@app.route('/roles/<int:id_rol>', methods=['GET'])
def obtener_rol(id_rol):
    rol = Rol.query.get_or_404(id_rol)
    rol_datos = {'id_rol': rol.id_rol, 'rol': rol.rol, 'descripcion': rol.descripcion}
    return jsonify(rol_datos), 200

@app.route('/roles/<int:id_rol>', methods=['PUT'])
def actualizar_rol(id_rol):
    rol = Rol.query.get_or_404(id_rol)
    datos = request.get_json()
    rol.rol = datos.get('rol', rol.rol)
    rol.descripcion = datos.get('descripcion', rol.descripcion)
    db.session.commit()
    return jsonify({'mensaje': 'Rol actualizado exitosamente'}), 200

@app.route('/roles/<int:id_rol>', methods=['DELETE'])
def eliminar_rol(id_rol):
    rol = Rol.query.get_or_404(id_rol)
    db.session.delete(rol)
    db.session.commit()
    return jsonify({'mensaje': 'Rol eliminado exitosamente'}), 200
######################################################################################################################################################
#––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––#
################################################################ CRUD de Géneros #####################################################################


# Rutas adicionales para CRUD de otros modelos

# Manejador global de errores
@app.errorhandler(Exception)
def handle_exception(error):
    return jsonify({'message': str(error)}), 500

# Iniciar la aplicación
if __name__ == '__main__':
    app.run(debug=True)
