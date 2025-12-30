export class CpfValidator {
  /**
   * Valida se um CPF é válido usando a regra tradicional
   * 1. Verifica se tem 11 dígitos
   * 2. Verifica se não é uma sequência repetida
   * 3. Calcula o 1º dígito verificador (DV1)
   *    - Multiplica os 9 primeiros dígitos por 10, 9, 8, ..., 2
   *    - Soma os resultados
   *    - Resto da divisão por 11
   *    - Se resto < 2, DV1 = 0; senão DV1 = 11 - resto
   * 4. Calcula o 2º dígito verificador (DV2)
   *    - Multiplica os 10 primeiros dígitos (9 + DV1) por 11, 10, 9, ..., 2
   *    - Soma os resultados
   *    - Resto da divisão por 11
   *    - Se resto < 2, DV2 = 0; senão DV2 = 11 - resto
   * 5. Compara os dígitos calculados com os informados
   */
  static isValid(cpf: string): boolean {
    // Remove caracteres especiais
    const cleanCpf = cpf.replace(/[^\d]/g, '');

    // 1. Verifica se tem 11 dígitos
    if (cleanCpf.length !== 11) {
      return false;
    }

    // 2. Verifica se não é uma sequência repetida (111.111.111-11, 222.222.222-22, etc)
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return false;
    }

    // 3. Calcula o primeiro dígito verificador (DV1)
    let sum = 0;
    let multiplier = 10;

    // Multiplica os 9 primeiros dígitos por 10, 9, 8, ..., 2
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf[i]) * multiplier;
      multiplier--;
    }

    // Calcula o resto da divisão por 11
    let remainder = sum % 11;

    // Se resto < 2, DV1 = 0; senão DV1 = 11 - resto
    const firstVerifyDigit = remainder < 2 ? 0 : 11 - remainder;

    // Compara com o 10º dígito informado
    if (parseInt(cleanCpf[9]) !== firstVerifyDigit) {
      return false;
    }

    // 4. Calcula o segundo dígito verificador (DV2)
    sum = 0;
    multiplier = 11;

    // Multiplica os 10 primeiros dígitos (9 + DV1) por 11, 10, 9, ..., 2
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf[i]) * multiplier;
      multiplier--;
    }

    // Calcula o resto da divisão por 11
    remainder = sum % 11;

    // Se resto < 2, DV2 = 0; senão DV2 = 11 - resto
    const secondVerifyDigit = remainder < 2 ? 0 : 11 - remainder;

    // Compara com o 11º dígito informado
    if (parseInt(cleanCpf[10]) !== secondVerifyDigit) {
      return false;
    }

    // 5. Se passou em todas as verificações, CPF é válido
    return true;
  }

  /**
   * Formata um CPF para o padrão: XXX.XXX.XXX-XX
   */
  static format(cpf: string): string {
    const cleanCpf = cpf.replace(/[^\d]/g, '');

    if (cleanCpf.length !== 11) {
      return cpf;
    }

    return `${cleanCpf.substring(0, 3)}.${cleanCpf.substring(3, 6)}.${cleanCpf.substring(6, 9)}-${cleanCpf.substring(9)}`;
  }

  /**
   * Remove formatação de um CPF
   */
  static unformat(cpf: string): string {
    return cpf.replace(/[^\d]/g, '');
  }
}
