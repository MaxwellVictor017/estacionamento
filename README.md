# Controle de Estacionamento

Sistema web desenvolvido para digitalizar o controle de entrada e saída de veículos em um estacionamento com capacidade para **50 vagas**. O projeto substitui o controle manual por uma interface prática, com validação de placas brasileiras, monitoramento de ocupação em tempo real e persistência local dos dados.

Projeto desenvolvido na disciplina de **Engenharia de Software (ADS)**, passando por todas as etapas do ciclo de desenvolvimento: levantamento de requisitos, regras de negócio, prototipação, implementação, testes e adaptação a mudança de escopo.

---

## Funcionalidades

- **Registro de entrada e saída:** cadastro rápido de veículos com liberação imediata da vaga na saída.
- **Controle de ocupação em tempo real:** contador dinâmico de vagas livres/ocupadas e barra de progresso com alerta visual conforme a lotação.
- **Validação de placas brasileiras:** aceita apenas placas válidas nos padrões **Antigo** (`ABC-1234` / `ABC1234`) e **Mercosul** (`ABC1D23`), bloqueando entradas vazias ou inválidas.
- **Prevenção de duplicidade:** normalização automática (maiúsculas e remoção de hífen) para impedir que o mesmo veículo seja registrado duas vezes enquanto estiver ativo no pátio.
- **Horário de entrada e permanência:** exibe a hora exata de entrada (`HH:MM:SS`) e o tempo decorrido de permanência de cada veículo ativo.
- **Busca em tempo real:** filtro instantâneo por placa na lista de veículos estacionados.
- **Persistência no navegador:** armazenamento automático via `localStorage`, mantendo os dados salvos mesmo após recarregar a página.
- **Limpeza do pátio:** opção com confirmação para zerar os registros rapidamente durante testes ou encerramento de turno.

---

## Regras de Negócio

| Regra | Descrição |
| --- | --- |
| **Capacidade máxima** | Limite fixo de **50 vagas**. Novas entradas são bloqueadas quando o pátio atinge a lotação máxima. |
| **Formato de placa** | Aceita exclusivamente `/^[A-Z]{3}-?[0-9]{4}$/` (padrão antigo) ou `/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/` (Mercosul). |
| **Unicidade** | Não permite cadastrar uma placa já ativa (tratando `ABC-1234` e `ABC1234` como a mesma placa). |
| **Liberação de vaga** | Ao registrar a saída, o veículo é removido da lista ativa e a vaga volta a ficar disponível imediatamente. |

---

## Tecnologias Utilizadas

- **HTML5:** estrutura semântica e acessível.
- **CSS3:** layout responsivo em grid, variáveis CSS e estilização moderna sem frameworks externos.
- **JavaScript (Vanilla JS):** manipulação segura do DOM, validação via Expressões Regulares (Regex) e persistência com `localStorage`.

> O projeto não utiliza dependências externas nem ferramentas de build, rodando diretamente no navegador.

---

## Estrutura do Projeto

```text
estacionamento/
├── index.html              # Estrutura da interface
├── style.css               # Estilização e responsividade
├── script.js               # Lógica de estado, validações, eventos e persistência
├── requisitos_sistemas.md  # Levantamento de requisitos, regras de negócio e testes
└── README.md               # Documentação do repositório
```

---

## Como Executar

1. Clone este repositório ou faça o download dos arquivos:
   ```bash
   git clone https://github.com/MaxwellVictor017/estacionamento.git
   ```
2. Acesse a pasta do projeto.
3. Abra o arquivo `index.html` diretamente no navegador de sua preferência (Chrome, Edge, Firefox, etc.).

---

## Decisões de Engenharia

- **Adaptação à mudança de escopo:** para atender ao requisito de exibir o horário de entrada sem quebrar a lógica existente, a lista de veículos foi estruturada como um array de objetos (`{ placa, entrada, timestamp }`) em vez de strings simples.
- **Segurança na renderização:** a listagem de veículos é construída via `document.createElement`, `textContent` e `addEventListener`, evitando injeção de HTML/XSS caso caracteres especiais sejam inseridos.
- **Descoberta em testes:** durante os testes de entrada, identificou-se que validar apenas campos vazios permitia o registro de caracteres isolados (ex.: `"G"`). A correção foi implementada com validação estrita por Regex para os dois padrões oficiais de placas no Brasil.

---

## Cenários de Teste Validados

- [x] Tentativa de entrada com o campo vazio.
- [x] Tentativa de entrada com formato inválido (ex.: letra isolada ou caracteres especiais).
- [x] Tentativa de cadastro de placa duplicada (incluindo variação com e sem hífen).
- [x] Registro de entrada válida com atualização imediata do contador e horário.
- [x] Registro de saída válida com liberação de vaga.
- [x] Bloqueio de novas entradas ao atingir 50 veículos ativos.
- [x] Persistência dos dados ao recarregar a página.

---

## Autor

Desenvolvido por **Maxwell Victor**.