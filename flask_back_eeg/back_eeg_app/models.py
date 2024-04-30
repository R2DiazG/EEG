from extensions import db
from datetime import datetime
from sqlalchemy.dialects.mysql import JSON

# Definition of the many-to-many relationship table between Sesion and Medicamento
sesion_medicamento = db.Table('sesiones_medicamentos',
    db.Column('id_sesion', db.Integer, db.ForeignKey('sesiones.id_sesion'), primary_key=True),
    db.Column('id_medicamento', db.Integer, db.ForeignKey('medicamentos.id_medicamento'), primary_key=True)
)

# Model for Roles
class Rol(db.Model):
    __tablename__ = 'roles'
    id_rol = db.Column(db.Integer, primary_key=True)
    rol = db.Column(db.String(255), unique=True, nullable=False)
    descripcion = db.Column(db.Text)

# Model for Users
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

# Model for Genders
class Genero(db.Model):
    __tablename__ = 'generos'
    id_genero = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(50), nullable=False)

# Model for Civil Status
class EstadoCivil(db.Model):
    __tablename__ = 'estados_civiles'
    id_estado_civil = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(50), nullable=False)

# Model for Schooling
class Escolaridad(db.Model):
    __tablename__ = 'escolaridades'
    id_escolaridad = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)

# Model for Laterality
class Lateralidad(db.Model):
    __tablename__ = 'lateralidades'
    id_lateralidad = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)

# Model for Occupations
class Ocupacion(db.Model):
    __tablename__ = 'ocupaciones'
    id_ocupacion = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)

# Model for Patients
class Paciente(db.Model):
    __tablename__ = 'pacientes'
    id_paciente = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'))
    nombre = db.Column(db.String(255), nullable=False)
    apellido_paterno = db.Column(db.String(255), nullable=False)
    apellido_materno = db.Column(db.String(255))
    fecha_nacimiento = db.Column(db.Date, nullable=False)
    id_genero = db.Column(db.Integer, db.ForeignKey('generos.id_genero'))
    genero = db.relationship('Genero', backref='pacientes')
    id_estado_civil = db.Column(db.Integer, db.ForeignKey('estados_civiles.id_estado_civil'))
    estado_civil = db.relationship('EstadoCivil', backref='pacientes')
    id_escolaridad = db.Column(db.Integer, db.ForeignKey('escolaridades.id_escolaridad'))
    escolaridad = db.relationship('Escolaridad', backref='pacientes')
    id_lateralidad = db.Column(db.Integer, db.ForeignKey('lateralidades.id_lateralidad'))
    lateralidad = db.relationship('Lateralidad', backref='pacientes')
    id_ocupacion = db.Column(db.Integer, db.ForeignKey('ocupaciones.id_ocupacion'))
    ocupacion = db.relationship('Ocupacion', backref='pacientes')
    # Relational attributes
    telefonos = db.relationship('Telefono', backref='paciente', lazy='dynamic')
    correos_electronicos = db.relationship('CorreoElectronico', backref='paciente', lazy='dynamic')
    direcciones = db.relationship('Direccion', backref='paciente', lazy='dynamic')
    sesiones = db.relationship('Sesion', backref='paciente', lazy='dynamic')
    consentimientos = db.relationship('Consentimiento', backref='paciente', lazy='dynamic')
    contacto_emergencia = db.relationship('ContactoEmergencia', uselist=False, back_populates='paciente')

# Model for Emerency Contacts
class ContactoEmergencia(db.Model):
    __tablename__ = 'contactos_emergencia'
    id_contacto_emergencia = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    nombre = db.Column(db.String(255), nullable=False)
    apellido_paterno = db.Column(db.String(255), nullable=False)
    apellido_materno = db.Column(db.String(255))
    parentesco = db.Column(db.String(255), nullable=False)
    telefono = db.Column(db.String(20), nullable=False)
    correo_electronico = db.Column(db.String(255))
    direccion = db.Column(db.String(255))
    ciudad = db.Column(db.String(255))
    estado = db.Column(db.String(255))
    codigo_postal = db.Column(db.String(20))
    pais = db.Column(db.String(255))
    notas = db.Column(db.Text)
    paciente = db.relationship('Paciente', back_populates='contacto_emergencia')

# Model for Phones
class Telefono(db.Model):
    __tablename__ = 'telefonos'
    id_telefono = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'))
    telefono = db.Column(db.String(255), nullable=False)

# Model for Emails
class CorreoElectronico(db.Model):
    __tablename__ = 'correos_electronicos'
    id_correo = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'))
    correo_electronico = db.Column(db.String(255), unique=True, nullable=False)

# Model for Addresses
class Direccion(db.Model):
    __tablename__ = 'direcciones'
    id_direccion = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'))
    calle_numero = db.Column(db.String(255))
    colonia = db.Column(db.String(255))
    ciudad = db.Column(db.String(255))
    estado = db.Column(db.String(255))
    pais = db.Column(db.String(255))
    codigo_postal = db.Column(db.String(20))

# Model for Medical History
class HistorialMedico(db.Model):
    id_historial_medico = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    historial_medico = db.Column(db.Text)

# Model for Previous Diagnosis
class DiagnosticoPrevio(db.Model):
    id_diagnostico_previo = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    descripcion = db.Column(db.Text)

# Model for Consent
class Consentimiento(db.Model):
    __tablename__ = 'consentimientos'
    id_consentimiento = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    consentimiento = db.Column(db.Boolean, nullable=False)
    fecha_registro = db.Column(db.DateTime, nullable=False)

# Model for Medicines
class Medicamento(db.Model):
    __tablename__ = 'medicamentos'
    id_medicamento = db.Column(db.Integer, primary_key=True)
    nombre_comercial = db.Column(db.String(255))
    principio_activo = db.Column(db.String(255))
    presentacion = db.Column(db.String(255))

# Model for Comments
class MetricaDesempeno(db.Model):
    __tablename__ = 'metricas_desempeno'
    id_metrica = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)
    valor = db.Column(db.Numeric(10, 4))
    fecha_hora_registro = db.Column(db.DateTime, nullable=False)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'))

# Model for logs
class LogActividadUsuario(db.Model):
    __tablename__ = 'logs_actividad_usuarios'
    id_log = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'))
    accion = db.Column(db.Text, nullable=False)
    fecha_hora_accion = db.Column(db.DateTime, nullable=False)

# Model for Predictions
class ResultadoPrediccion(db.Model):
    __tablename__ = 'resultados_prediccion'
    id_resultado_prediccion = db.Column(db.Integer, primary_key=True)
    id_eeg_procesado = db.Column(db.Integer, db.ForeignKey('normalized_eeg.id_eeg_procesado'))
    resultado_prediccion = db.Column(db.Text, nullable=False)
    nivel_confianza = db.Column(db.Numeric(5, 2))
    fecha_hora_prediccion = db.Column(db.DateTime, nullable=False)

# Model for Sessions
class Sesion(db.Model):
    __tablename__ = 'sesiones'
    id_sesion = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    fecha_consulta = db.Column(db.Date, nullable=False)
    estado_general = db.Column(db.String(255))
    estado_especifico = db.Column(db.String(255)) 
    resumen_sesion_actual = db.Column(db.Text)
    notas_psicologo = db.Column(db.Text)
    raw_eegs = db.relationship('RawEEG', backref='sesion', lazy='dynamic', cascade='all, delete-orphan')
    normalized_eegs = db.relationship('NormalizedEEG', backref='sesion', lazy='dynamic', cascade='all, delete-orphan')
    medicamentos = db.relationship('Medicamento', secondary=sesion_medicamento, backref=db.backref('sesiones', lazy='dynamic'))

# Model for Raw EEG
class RawEEG(db.Model):
    __tablename__ = 'raw_eeg'
    id_eeg = db.Column(db.Integer, primary_key=True)
    id_sesion = db.Column(db.Integer, db.ForeignKey('sesiones.id_sesion'), nullable=False)
    fecha_hora_registro = db.Column(db.DateTime, nullable=False)
    data = db.Column(db.JSON)

# Model for Normalized EEG
class NormalizedEEG(db.Model):
    __tablename__ = 'normalized_eeg'
    id_eeg_procesado = db.Column(db.Integer, primary_key=True)
    id_sesion = db.Column(db.Integer, db.ForeignKey('sesiones.id_sesion'), nullable=False)
    fecha_hora_procesado = db.Column(db.DateTime, nullable=False)
    data_normalized = db.Column(db.JSON)
    data_psd = db.Column(db.JSON)
    data_stft = db.Column(db.JSON)
    data_area_bandas_psd = db.Column(db.JSON)
    data_area_bandas_pr = db.Column(db.JSON)