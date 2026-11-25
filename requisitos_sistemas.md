# Documento de Requisitos — Controle de Estacionamento

**Projeto:** Sistema Web de Controle de Estacionamento  
**Disciplina:** Engenharia de Software I + II (ADS — Fatec Carapicuíba)  

---

## 1. Problema
Atualmente, o controle do estacionamento da empresa é feito de forma totalmente manual. Esse processo gera falhas frequentes, como a perda de tickets pelos motoristas e a impossibilidade de saber, em tempo real, a ocupação real do pátio e quantas vagas ainda estão disponíveis.

## 2. Objetivo
Desenvolver um protótipo de sistema web simples e funcional que permita registrar a entrada e a saída de veículos de forma digital, controlar automaticamente a quantidade de vagas livres e manter uma lista atualizada dos veículos ativos no estacionamento.

## 3. Usuários do Sistema
* **Operador de Estacionamento / Guarita:** Responsável por registrar as placas na entrada, consultar as vagas disponíveis e dar baixa nos veículos no momento da saída.
* **Gestor / Supervisor (indireto):** Beneficia-se do controle preciso da ocupação em tempo real.

---

## 4. Entrevista com o Cliente (5 Perguntas e Respostas)

1. **Quem vai utilizar o sistema no dia a dia?**  
   *Resposta:* Os operadores da guarita, que precisam de uma tela rápida e direta para digitar a placa e registrar entradas e saídas sem gerar filas.

2. **Qual é a capacidade máxima do estacionamento?**  
   *Resposta:* O pátio possui exatamente 50 vagas disponíveis para veículos. Quando atingir esse limite, o sistema não deve permitir novas entradas.

3. **Quais informações são essenciais no momento da entrada do veículo?**  
   *Resposta:* Inicialmente, a placa do veículo é obrigatória. Posteriormente, surgiu também a necessidade de registrar e exibir o horário exato de entrada para facilitar o controle de permanência.

4. **Como deve funcionar o processo de saída e há regras de cobrança nesta primeira versão?**  
   *Resposta:* Nesta primeira versão (protótipo), não haverá módulo financeiro/cobrança. Ao clicar na saída de um veículo na lista, ele deve ser removido dos veículos ativos e a vaga deve ser liberada imediatamente.

5. **Existe alguma regra especial para evitar erros de digitação ou registros incorretos?**  
   *Resposta:* Sim. O sistema não pode aceitar registros com o campo de placa vazio e não pode permitir que a mesma placa seja registrada duas vezes enquanto o veículo ainda estiver dentro do estacionamento.

---

## 5. Requisitos Funcionais (RF)

| Código | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF01** | Registrar entrada | O sistema deve permitir cadastrar a placa de um veículo que está entrando no estacionamento. |
| **RF02** | Registrar saída | O sistema deve permitir registrar a saída de um veículo ativo, removendo-o da lista. |
| **RF03** | Mostrar vagas livres | O sistema deve calcular e exibir dinamicamente a quantidade de vagas disponíveis. |
| **RF04** | Evitar duplicidade | O sistema deve impedir o cadastro de uma placa que já esteja registrada como ativa no pátio. |
| **RF05** | Exibir veículos ativos | O sistema deve listar na tela todos os veículos que estão atualmente no estacionamento. |
| **RF06** | Exibir horário de entrada *(Mudança de escopo)* | O sistema deve registrar e exibir o horário de entrada ao lado de cada veículo ativo na lista. |

---

## 6. Regras de Negócio (RN)

* **RN01 — Capacidade Máxima:** O estacionamento possui limite fixo de 50 vagas. Ao atingir 50 veículos ativos, novas entradas devem ser bloqueadas com um aviso de lotação.
* **RN02 — Validação de Campo Obrigatório:** Não é permitido registrar uma entrada com a placa vazia ou contendo apenas espaços em branco.
* **RN03 — Unicidade de Placa Ativa:** Uma placa já presente na lista de veículos ativos não pode ser inserida novamente (a comparação deve ignorar diferenças entre maiúsculas e minúsculas).
* **RN04 — Liberação de Vaga:** Ao registrar a saída de um veículo, a vaga correspondente deve ser liberada imediatamente, atualizando o contador de vagas livres.

---

## 7. Checklist de Testes Previstos
- [ ] Tentar registrar entrada com o campo de placa vazio.
- [ ] Tentar registrar a mesma placa duas vezes seguidas.
- [ ] Registrar uma entrada válida e verificar se o veículo aparece na lista (com horário) e se o contador diminui.
- [ ] Registrar uma saída válida e verificar se o veículo sai da lista e se o contador aumenta.
- [ ] Simular a lotação máxima (50 veículos) e confirmar o bloqueio da 51ª entrada.