from app import db

# Modelo para Roles
class Rol(db.Model):
    __tablename__ = 'roles'
    id_rol = db.Column(db.Integer, primary_key=True)
    rol = db.Column(db.String(255), unique=True, nullable=False)
    descripcion = db.Column(db.Text)

# Modelo para Usuarios
class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id_usuario = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255))
    apellidos = db.Column(db.String(255))
    username = db.Column(db.String(255), unique=True)
    contraseña = db.Column(db.String(255))  # Considerar el uso de bcrypt para hashing
    correo = db.Column(db.String(255), unique=True)
    aprobacion = db.Column(db.Boolean, nullable=False)
    id_rol = db.Column(db.Integer, db.ForeignKey('roles.id_rol'))

# Modelo para Géneros
class Genero(db.Model):
    __tablename__ = 'generos'
    id_genero = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(50), nullable=False)

# Modelo para Estados Civiles
class EstadoCivil(db.Model):
    __tablename__ = 'estados_civiles'
    id_estado_civil = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(50), nullable=False)

# Modelo para Escolaridades
class Escolaridad(db.Model):
    __tablename__ = 'escolaridades'
    id_escolaridad = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)

# Modelo para Lateralidades
class Lateralidad(db.Model):
    __tablename__ = 'lateralidades'
    id_lateralidad = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)

# Modelo para Ocupaciones
class Ocupacion(db.Model):
    __tablename__ = 'ocupaciones'
    id_ocupacion = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)

# Modelo para Pacientes
class Paciente(db.Model):
    __tablename__ = 'pacientes'
    id_paciente = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'))
    nombre = db.Column(db.String(255), nullable=False)
    apellido_paterno = db.Column(db.String(255), nullable=False)
    apellido_materno = db.Column(db.String(255))
    fecha_nacimiento = db.Column(db.Date, nullable=False)
    id_genero = db.Column(db.Integer, db.ForeignKey('generos.id_genero'))
    id_estado_civil = db.Column(db.Integer, db.ForeignKey('estados_civiles.id_estado_civil'))
    id_escolaridad = db.Column(db.Integer, db.ForeignKey('escolaridades.id_escolaridad'))
    id_lateralidad = db.Column(db.Integer, db.ForeignKey('lateralidades.id_lateralidad'))
    id_ocupacion = db.Column(db.Integer, db.ForeignKey('ocupaciones.id_ocupacion'))

# Modelo para Teléfonos
class Telefono(db.Model):
    __tablename__ = 'telefonos'
    id_telefono = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'))
    telefono = db.Column(db.String(255), nullable=False)

# Modelo para Correos Electrónicos
class CorreoElectronico(db.Model):
    __tablename__ = 'correos_electronicos'
    id_correo = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'))
    correo_electronico = db.Column(db.String(255), unique=True, nullable=False)

# Modelo para Direcciones
class Direccion(db.Model):
    __tablename__ = 'direcciones'
    id_direccion = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'))
    calle_numero = db.Column(db.String(255))
    colonia = db.Column(db.String(255))
    ciudad = db.Column(db.String(255))
    estado = db.Column(db.String(255))
    pais = db.Column(db.String(255))
