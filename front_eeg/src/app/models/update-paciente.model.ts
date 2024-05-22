export class UpdatePaciente {
        id_paciente?: number;
        nombre?: string;
        apellido_paterno?: string;
        apellido_materno?: string;
        fecha_nacimiento?: Date | string;  
        id_genero?: number;
        id_estado_civil?: number;
        id_escolaridad?: number;
        id_ocupacion?: number;
        id_lateralidad?: number;
    
        edad?: number;
        notas_ultima_sesion?: string;
    
        genero?: 'Masculino' | 'Femenino';
        estado_civil?: 'Soltero/a' | 'Casado/a' | 'Divorciado/a' | 'Viudo/a';
        escolaridad?: 'Primaria' | 'Secundaria' | 'Preparatoria' | 'Universidad' | 'Posgrado' | 'Otro';
        ocupacion?: 'Estudiante' | 'Empleado' | 'Empresario' | 'Independiente';
        lateralidad?: 'Izquierda' | 'Derecha' | 'ambidextrous';
    
        telefonos: { telefono: string }[] = [];
        correos_electronicos: { correo_electronico: string }[] = [];
        direcciones: {
            calle_numero: string;
            colonia?: string;
            ciudad: string;
            estado: string;
            pais: string;
            codigo_postal: string;
        }[] = [];
    
        contacto_emergencia: {
            nombre?: string;
            apellido_paterno?: string;
            apellido_materno?: string;
            ciudad?: string;
            codigo_postal?: string;
            correo_electronico: string;
            direccion: string;
            colonia: string;
            estado: string;
            notas: string;
            pais: string;
            parentesco: string;
            telefono: string;
        } = {} as any;

        consentimientos: {
            consentimiento: number; 
            fecha_registro: string;
            audio_filename: string;
        }[] = [];
}
