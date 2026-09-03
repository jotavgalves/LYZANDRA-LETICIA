import { DEFAULT_LEGAL } from './legal-content.js';

export const TEMPORARY_LEGAL = {
  ...DEFAULT_LEGAL,
  version: 2,
  business: {
    ...DEFAULT_LEGAL.business,
    brandName: 'Ly Cílios',
    courseName: 'Speed Lash',
    instructorName: 'Lyzandra Letícia',
    supplierName: '',
    taxId: '',
    physicalAddress: '',
    contactEmail: '',
    contactLabel: 'Canal oficial de atendimento disponibilizado na página principal',
    checkoutPlatform: 'Kiwify'
  },
  terms: {
    ...DEFAULT_LEGAL.terms,
    updatedAt: '2026-09-03',
    badge: 'CONDIÇÕES DE COMPRA E USO',
    title: 'Termos de Uso e Compra',
    intro: 'Estes Termos regulam o acesso ao site e a contratação do curso digital Speed Lash, apresentado pela marca Ly Cílios e pela instrutora Lyzandra Letícia. Ao navegar pelo site ou concluir uma compra, você declara estar ciente das condições apresentadas na oferta e no checkout.',
    highlights: [
      { title: 'Produto digital', text: 'Curso online de caráter educacional, com condições conforme a oferta vigente.' },
      { title: 'Garantia de 7 dias', text: 'A oferta informa prazo de 7 dias para solicitação de cancelamento ou reembolso.' },
      { title: 'Uso individual', text: 'O acesso adquirido é pessoal e não pode ser compartilhado, vendido ou cedido.' },
      { title: 'Resultados variam', text: 'Resultados técnicos e financeiros dependem de prática, contexto e execução individual.' }
    ],
    sections: [
      { title: '1. Sobre o curso', body: 'O Speed Lash é um curso online de caráter educacional voltado ao aperfeiçoamento de técnicas relacionadas à extensão de cílios. O conteúdo, módulos, bônus, certificado, suporte, preço, formas de pagamento e demais condições válidas são aquelas apresentadas na página de vendas e no checkout no momento da contratação.' },
      { title: '2. Compra e pagamento', body: 'O pagamento é processado por plataforma externa especializada. A aprovação da compra, parcelamento, análise antifraude, estorno e demais procedimentos financeiros podem seguir as regras operacionais da plataforma utilizada.\n\nO acesso ao curso é liberado conforme a confirmação do pagamento e as instruções enviadas ao comprador.' },
      { title: '3. Direito de arrependimento e garantia', body: 'Nas compras realizadas pela internet, o consumidor possui direito de arrependimento nos termos da legislação brasileira. A oferta do Speed Lash informa prazo de 7 dias para solicitação de cancelamento ou reembolso, contado conforme aplicável à contratação.\n\nA solicitação poderá ser realizada pelo canal oficial de atendimento informado no site ou pelos mecanismos disponíveis na plataforma de checkout, sem prejuízo de outros direitos obrigatórios previstos em lei.' },
      { title: '4. Uso individual', body: 'O acesso adquirido é pessoal e destinado exclusivamente ao comprador. Não é permitido compartilhar, vender, ceder, alugar ou disponibilizar credenciais de acesso a terceiros.' },
      { title: '5. Direitos sobre o conteúdo', body: 'As aulas, vídeos, textos, materiais, apostilas, imagens, identidade visual, métodos e demais conteúdos do Speed Lash são protegidos pela legislação aplicável.\n\nA compra concede ao aluno direito de uso para estudo pessoal. Não é permitido reproduzir, distribuir, revender ou explorar comercialmente o conteúdo sem autorização.' },
      { title: '6. Resultados', body: 'O curso possui finalidade educacional. Não há garantia de faturamento, quantidade de clientes, velocidade exata de atendimento, retenção específica ou qualquer outro resultado individual.\n\nOs resultados dependem de fatores como experiência, prática, materiais, técnica, características da cliente e execução da aluna. Depoimentos e exemplos apresentados no site representam experiências individuais e não constituem promessa de resultado.' },
      { title: '7. Responsabilidade da aluna', body: 'A aplicação prática das técnicas deve observar cuidados de higiene, biossegurança, condições individuais da cliente e demais normas aplicáveis à atividade profissional. Cabe à aluna avaliar sua preparação antes de executar procedimentos em terceiros.' },
      { title: '8. Disponibilidade e suporte', body: 'Podem ocorrer indisponibilidades temporárias decorrentes de manutenção ou de serviços de terceiros. Quando houver problema relevante relacionado ao acesso ao curso, serão adotadas medidas razoáveis para restabelecimento ou orientação ao aluno.' },
      { title: '9. Privacidade', body: 'O tratamento de dados pessoais relacionado ao site, às campanhas e à compra é explicado na Política de Privacidade. Plataformas externas de pagamento e outros prestadores também podem possuir políticas próprias.' },
      { title: '10. Alterações e atendimento', body: 'Estes Termos podem ser atualizados para refletir mudanças no produto, na operação ou na legislação. Alterações posteriores não retiram direitos obrigatórios já assegurados ao consumidor.\n\nDúvidas relacionadas à compra, acesso, cancelamento ou suporte deverão ser encaminhadas pelo canal oficial de atendimento disponibilizado no site. A relação de consumo é regida pela legislação brasileira.' }
    ]
  },
  privacy: {
    ...DEFAULT_LEGAL.privacy,
    updatedAt: '2026-09-03',
    badge: 'PRIVACIDADE E PROTEÇÃO DE DADOS',
    title: 'Política de Privacidade',
    intro: 'Esta Política explica como dados pessoais podem ser tratados quando você acessa o site do Speed Lash, entra em contato, interage com campanhas publicitárias ou realiza uma compra. O tratamento deve observar a Lei Geral de Proteção de Dados Pessoais (LGPD) e demais normas aplicáveis.',
    highlights: [
      { title: 'Transparência', text: 'Explicamos quais dados podem ser tratados e para quais finalidades.' },
      { title: 'Cookies e medição', text: 'Ferramentas de publicidade e analytics podem ser usadas conforme a configuração do site.' },
      { title: 'Sem venda de dados', text: 'Dados pessoais não são comercializados como produto.' },
      { title: 'Seus direitos', text: 'Você pode solicitar medidas previstas na LGPD pelo canal oficial de atendimento.' }
    ],
    sections: [
      { title: '1. Dados que podem ser coletados', body: 'Dependendo da forma como você utiliza o site, poderão ser tratados:\n- endereço IP, navegador, dispositivo e informações técnicas;\n- páginas visitadas e interações realizadas no site;\n- origem da visita e parâmetros de campanha, como UTM, gclid e fbclid;\n- preferências relacionadas a cookies;\n- nome, telefone, e-mail e informações fornecidas voluntariamente em contatos;\n- dados necessários à compra, coletados pela plataforma de checkout.' },
      { title: '2. Para que usamos esses dados', body: 'Os dados podem ser utilizados para:\n- manter e proteger o funcionamento do site;\n- responder dúvidas e solicitações;\n- viabilizar compra e acesso ao curso;\n- medir desempenho de campanhas e anúncios;\n- compreender como os visitantes utilizam a página;\n- prevenir fraude e abuso;\n- cumprir obrigações legais;\n- exercer ou defender direitos.' },
      { title: '3. Cookies e ferramentas de medição', body: 'O site poderá utilizar cookies e tecnologias vinculadas a ferramentas como Meta Pixel, Google Analytics, Google Ads e Google Tag Manager. Essas tecnologias podem ser usadas para medir visitas, cliques, conversões e desempenho de campanhas.\n\nQuando houver mecanismo de consentimento disponível, as tecnologias opcionais serão utilizadas conforme as preferências selecionadas pelo visitante.' },
      { title: '4. Pagamento e checkout', body: 'A compra do curso pode ocorrer em plataforma externa de checkout. Nesse ambiente, dados necessários a pagamento, cadastro, prevenção de fraude, reembolso e liberação de acesso poderão ser tratados diretamente pela plataforma e por fornecedores envolvidos no processamento financeiro.\n\nA política de privacidade da plataforma utilizada também se aplica aos tratamentos realizados por ela.' },
      { title: '5. Compartilhamento de dados', body: 'Os dados poderão ser compartilhados somente quando necessário com prestadores relacionados à operação, como hospedagem e infraestrutura, ferramentas de analytics, plataformas de publicidade, atendimento, checkout e pagamentos, serviços de prevenção de fraude e autoridades públicas quando houver obrigação legal.\n\nNão comercializamos dados pessoais como produto.' },
      { title: '6. Bases legais', body: 'O tratamento poderá ocorrer com fundamento nas hipóteses previstas na LGPD, incluindo execução de contrato, cumprimento de obrigação legal, exercício regular de direitos, legítimo interesse e consentimento, conforme a finalidade e o caso concreto.' },
      { title: '7. Retenção', body: 'Os dados serão mantidos pelo período necessário para cumprir as finalidades para as quais foram coletados, atender obrigações legais, manter registros da contratação, prevenir fraude e permitir o exercício de direitos.' },
      { title: '8. Segurança', body: 'São adotadas medidas razoáveis de segurança para reduzir riscos de acesso indevido, perda, alteração ou divulgação não autorizada. Nenhum sistema conectado à internet, contudo, pode ser considerado absolutamente imune a incidentes.' },
      { title: '9. Direitos do titular', body: 'Nos termos da LGPD e conforme aplicável, o titular poderá solicitar confirmação da existência de tratamento, acesso aos dados, correção de informações, anonimização, bloqueio ou eliminação nas hipóteses legais, informações sobre compartilhamentos, revogação do consentimento, oposição ao tratamento e demais direitos previstos em lei.\n\nAs solicitações deverão ser realizadas pelo canal oficial de atendimento indicado no site.' },
      { title: '10. Transferências internacionais', body: 'Alguns serviços utilizados pelo site podem possuir infraestrutura fora do Brasil. Nesses casos, dados poderão ser processados internacionalmente conforme as regras aplicáveis e as políticas dos fornecedores envolvidos.' },
      { title: '11. Atualizações desta Política', body: 'Esta Política poderá ser alterada para refletir mudanças no site, nas ferramentas utilizadas ou na legislação. A versão mais recente será identificada pela data apresentada no início da página.' }
    ]
  }
};
