import { ScenarioCategory, ScriptScenario } from "../types/cs";

export const INITIAL_SCENARIOS: ScriptScenario[] = [
  {
    id: "s1",
    number: 1,
    title: "Address / Description Update",
    category: ScenarioCategory.GENERAL,
    whenToUse:
      'Customer says their address is correct but wants to add or remove a description (e.g., old house number, "Casa 3").',
    policyRule:
      "Delivery goes strictly to the registered Shopee shipping label address; advise updating in-app before ship-out.",
    guideIds: ["change-address"],
    sampleInput:
      "Order #261112BR89X1 (Wireless Mouse) > Customer says the street is right, but wants the courier to ignore 'Casa 3' in the address description because it's from their old house.",
    rows: [
      {
        section: "Greeting",
        english: "Hello! Thank you for letting us know about the address description.",
        portuguese: "Olá! Muito obrigado por nos informar sobre a descrição do endereço.",
      },
      {
        section: "Address note",
        english:
          "We understand your current address is correct, but the old description belongs to your previous residence and you want the delivery person to disregard it.",
        portuguese:
          "Entendemos que o seu endereço atual está correto, mas a descrição antiga pertence à sua residência anterior e você gostaria que o entregador a desconsiderasse.",
      },
      {
        section: "Important reminder",
        english:
          "Delivery is made strictly to the address registered in the Shopee account. If the old description is still saved in Shopee, we strongly recommend updating or removing it directly in the Shopee app before ship-out to avoid confusion.",
        portuguese:
          "Por favor, observe que a entrega será feita estritamente no endereço cadastrado na sua conta da Shopee. Se a descrição antiga ainda estiver salva na Shopee, recomendamos fortemente que você a atualize ou remova diretamente no aplicativo da Shopee antes do envio, para evitar qualquer confusão durante a entrega.",
        highlight: true,
      },
      {
        section: "Store action",
        english:
          "Since your order is still being prepared and not yet shipped, we will also try to add a note if possible. However, the courier follows the official address on the shipping label.",
        portuguese:
          "Como o seu pedido ainda está sendo preparado e ainda não foi enviado, também tentaremos adicionar uma observação se possível. No entanto, o entregador segue principalmente o endereço oficial impresso na etiqueta de envio.",
      },
      {
        section: "Assurance",
        english:
          "Rest assured that updating your address directly in the Shopee app guarantees the courier has the exact delivery details for your order.",
        portuguese:
          "Fique tranquilo, pois atualizar o endereço diretamente no aplicativo da Shopee garante que o entregador tenha os dados exatos para a entrega do seu pedido.",
      },
      {
        section: "Closing",
        english: "Thank you again for the heads up, and we hope your order arrives smoothly.",
        portuguese: "Obrigado novamente pelo aviso, e esperamos que o seu pedido chegue sem problemas.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Initial Reply (Address Label Reminder)",
        cxTrigger: "CX asks to add/ignore an old address description before shipping",
        rows: [
          {
            section: "Greeting",
            english: "Hello! Thank you for letting us know about the address description.",
            portuguese: "Olá! Muito obrigado por nos informar sobre a descrição do endereço.",
          },
          {
            section: "Important reminder",
            english:
              "Delivery is made strictly to the address registered in the Shopee account. If the old description is still saved in Shopee, we strongly recommend updating or removing it directly in the Shopee app before ship-out to avoid confusion.",
            portuguese:
              "Por favor, observe que a entrega será feita estritamente no endereço cadastrado na sua conta da Shopee. Se a descrição antiga ainda estiver salva na Shopee, recomendamos fortemente que você a atualize ou remova diretamente no aplicativo da Shopee antes do envio.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured that updating your address directly in the Shopee app guarantees the courier has the exact delivery details for your order.",
            portuguese:
              "Fique tranquilo, pois atualizar o endereço diretamente no aplicativo da Shopee garante que o entregador tenha os dados exatos para a entrega do seu pedido.",
          },
          {
            section: "Closing",
            english: "Thank you again for the heads up, and we hope your order arrives smoothly.",
            portuguese: "Obrigado novamente pelo aviso, e esperamos que o seu pedido chegue sem problemas.",
          },
        ],
      },
      {
        id: "already-updated",
        label: "2. CX Confirmed Address Updated",
        cxTrigger: "CX confirms they updated or cannot edit the address after shipping label creation",
        rows: [
          {
            section: "Acknowledgment",
            english: "Thank you for checking and letting us know!",
            portuguese: "Obrigado por verificar e nos avisar!",
          },
          {
            section: "Guidance",
            english:
              "If the shipping label has already been generated and the app no longer allows editing, you may cancel and reorder with the updated address while still in preparation—or keep an eye on tracking so someone can guide the courier upon arrival.",
            portuguese:
              "Se a etiqueta de envio já tiver sido gerada e o aplicativo não permitir mais a edição, você pode cancelar e refazer o pedido com o endereço atualizado enquanto ainda está em preparação — ou acompanhar o rastreio para orientar o entregador na chegada.",
            highlight: true,
          },
          {
            section: "Assurance",
            english: "Rest assured your purchase remains protected by Shopee Guarantee.",
            portuguese: "Fique tranquilo, pois a sua compra continua protegida pela Garantia Shopee.",
          },
        ],
      },
    ],
  },
  {
    id: "s2",
    number: 2,
    title: "Product Defect / Issue (Ask Video)",
    category: ScenarioCategory.PRODUCT,
    whenToUse:
      "Customer reports a product problem (not working, shutting off, broken, etc.). Always request a video or photo first and say our team will review it—never guarantee a return or refund on the spot.",
    policyRule:
      "Never promise an immediate return/refund. Request a short video/photo first for team review and share all 4 checks (1. Power supply, 2. Overheating, 3. Loose connections, 4. Short circuit).",
    guideIds: ["return-refund", "refund-sla"],
    sampleInput:
      "Order #261110BR44K2 (Mini LED Projector) > CX says it turns on for 10 seconds and then shuts off by itself.",
    rows: [
      {
        section: "Greeting",
        english: "Good evening! Thank you for contacting us. We are sorry to hear about this issue.",
        portuguese: "Boa noite! Obrigado por entrar em contato conosco. Lamentamos saber sobre esse problema.",
      },
      {
        section: "Request video",
        english:
          "To better assist you and verify the issue, could you please provide us with a short video showing the problem? This will help us understand exactly what is happening.",
        portuguese:
          "Para melhor assisti-lo e verificar o problema, você poderia nos enviar um vídeo curto mostrando o problema? Isso nos ajudará a entender exatamente o que está acontecendo.",
        highlight: true,
      },
      {
        section: "Common causes intro",
        english: "In the meantime, here are some common causes that may be simple to fix:",
        portuguese: "Enquanto isso, aqui estão algumas causas comuns que podem ser simples de resolver:",
      },
      {
        section: "1. Power supply",
        english:
          "Please check that your power supply is providing the correct voltage and sufficient current. If the power is too low or unstable, the protection circuit may shut the item off.",
        portuguese:
          "Por favor, verifique se a sua fonte de alimentação está fornecendo a voltagem correta e corrente suficiente. Se a energia estiver muito baixa ou instável, o circuito de proteção pode desligar o item.",
      },
      {
        section: "2. Overheating",
        english:
          "If the item gets too hot, it may trigger overheating protection and shut down. Make sure it has enough ventilation and is not enclosed in a tight space.",
        portuguese:
          "Se o item esquentar demais, pode acionar a proteção contra superaquecimento e desligar. Certifique-se de que tenha ventilação suficiente e não esteja fechado em um espaço apertado.",
      },
      {
        section: "3. Loose connections",
        english:
          "Please check that all wire connections and cables are securely connected. A loose connection can cause sudden power loss.",
        portuguese:
          "Por favor, verifique se todas as conexões de fios e cabos estão firmemente conectadas. Uma conexão solta pode causar perda súbita de energia.",
      },
      {
        section: "4. Short circuit",
        english:
          "If any wires are touching each other or the item is touching a metal surface, it may trigger short circuit protection. Please check that wires are properly insulated and separated.",
        portuguese:
          "Se algum fio estiver se tocando ou o item estiver tocando uma superfície metálica, pode acionar a proteção contra curto-circuito. Por favor, verifique se os fios estão devidamente isolados e separados.",
      },
      {
        section: "Next steps",
        english:
          "Please try checking these points first. If the problem continues after verifying these items, please send us the video and we will review it with our team to find the best solution for you.",
        portuguese:
          "Por favor, tente verificar esses pontos primeiro. Se o problema continuar após verificar esses itens, nos envie o vídeo e revisaremos com a nossa equipe para encontrar a melhor solução para você.",
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Rest assured that our team will review your case carefully once you send the video, and your purchase remains protected by Shopee Guarantee.",
        portuguese:
          "Fique tranquilo, pois a nossa equipe analisará o seu caso com atenção assim que você enviar o vídeo, e a sua compra continua protegida pela Garantia Shopee.",
        highlight: true,
      },
      {
        section: "Closing",
        english: "We appreciate your cooperation and hope we can resolve this issue for you quickly.",
        portuguese: "Agradecemos a sua cooperação e esperamos poder resolver esse problema para você rapidamente.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Initial Reply (Ask Video + 4 Checks)",
        cxTrigger: "CX reports the product has a defect or stopped working",
        rows: [
          {
            section: "Greeting",
            english: "Good evening! Thank you for contacting us. We are sorry to hear about this issue.",
            portuguese: "Boa noite! Obrigado por entrar em contato conosco. Lamentamos saber sobre esse problema.",
          },
          {
            section: "Request video",
            english:
              "To better assist you and verify the issue, could you please provide us with a short video showing the problem? This will help us understand exactly what is happening.",
            portuguese:
              "Para melhor assisti-lo e verificar o problema, você poderia nos enviar um vídeo curto mostrando o problema? Isso nos ajudará a entender exatamente o que está acontecendo.",
            highlight: true,
          },
          {
            section: "Common causes intro",
            english: "In the meantime, here are some common causes that may be simple to fix:",
            portuguese: "Enquanto isso, aqui estão algumas causas comuns que podem ser simples de resolver:",
          },
          {
            section: "1. Power supply",
            english:
              "Please check that your power supply is providing the correct voltage and sufficient current. If the power is too low or unstable, the protection circuit may shut the item off.",
            portuguese:
              "Por favor, verifique se a sua fonte de alimentação está fornecendo a voltagem correta e corrente suficiente. Se a energia estiver muito baixa ou instável, o circuito de proteção pode desligar o item.",
          },
          {
            section: "2. Overheating",
            english:
              "If the item gets too hot, it may trigger overheating protection and shut down. Make sure it has enough ventilation and is not enclosed in a tight space.",
            portuguese:
              "Se o item esquentar demais, pode acionar a proteção contra superaquecimento e desligar. Certifique-se de que tenha ventilação suficiente e não esteja fechado em um espaço apertado.",
          },
          {
            section: "3. Loose connections",
            english:
              "Please check that all wire connections and cables are securely connected. A loose connection can cause sudden power loss.",
            portuguese:
              "Por favor, verifique se todas as conexões de fios e cabos estão firmemente conectadas. Uma conexão solta pode causar perda súbita de energia.",
          },
          {
            section: "4. Short circuit",
            english:
              "If any wires are touching each other or the item is touching a metal surface, it may trigger short circuit protection. Please check that wires are properly insulated and separated.",
            portuguese:
              "Se algum fio estiver se tocando ou o item estiver tocando uma superfície metálica, pode acionar a proteção contra curto-circuito. Por favor, verifique se os fios estão devidamente isolados e separados.",
          },
          {
            section: "Next steps",
            english:
              "Please try checking these points first. If the problem continues after verifying these items, please send us the video and we will review it with our team to find the best solution for you.",
            portuguese:
              "Por favor, tente verificar esses pontos primeiro. Se o problema continuar após verificar esses itens, nos envie o vídeo e revisaremos com a nossa equipe para encontrar a melhor solução para você.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured that our team will review your case carefully once you send the video, and your purchase remains protected by Shopee Guarantee.",
            portuguese:
              "Fique tranquilo, pois a nossa equipe analisará o seu caso com atenção assim que você enviar o vídeo, e a sua compra continua protegida pela Garantia Shopee.",
            highlight: true,
          },
          {
            section: "Closing",
            english: "We appreciate your cooperation and hope we can resolve this issue for you quickly.",
            portuguese: "Agradecemos a sua cooperação e esperamos poder resolver esse problema para você rapidamente.",
          },
        ],
      },
      {
        id: "video-sent",
        label: "2. CX Sent Video (Still Not Working)",
        cxTrigger: "CX sent the video showing troubleshooting did not fix the defect",
        rows: [
          {
            section: "Thank for video",
            english: "Thank you very much for sending the video and trying those checks first.",
            portuguese: "Muito obrigado por enviar o vídeo e por testar essas verificações primeiro.",
          },
          {
            section: "Return/Refund guidance",
            english:
              'Since the issue persists, please go to your order details in the Shopee app and tap the "Return/Refund" button with your video attached so Shopee can review and process your return/refund safely.',
            portuguese:
              'Como o problema continua, por favor acesse os detalhes do pedido no aplicativo da Shopee e toque no botão "Devolução/Reembolso" anexando o seu vídeo para que a Shopee possa analisar e processar a sua devolução/reembolso com segurança.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is protected by Shopee Guarantee—once your Return/Refund request is reviewed and approved, your money will be refunded immediately.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que a sua solicitação de Devolução/Reembolso for analisada e aprovada, o seu dinheiro será reembolsado imediatamente.",
            highlight: true,
          },
          {
            section: "Closing",
            english: "We sincerely apologize for the inconvenience and remain at your disposal if you need any further help.",
            portuguese: "Pedimos sinceras desculpas pelo inconveniente e permanecemos à sua disposição se precisar de mais alguma ajuda.",
          },
        ],
      },
    ],
  },
  {
    id: "s3",
    number: 3,
    title: "Order Stuck at Customs",
    category: ScenarioCategory.DELAYED,
    whenToUse:
      'Tracking shows "inspeção na alfândega" or similar for several days. Do not mention "lost" or suggest refund unless CX asks.',
    policyRule:
      'Must state both required phrases: "we follow up this to courier" and "we expedite follow your order to courier".',
    guideIds: ["return-refund", "find-order"],
    sampleInput:
      "Order #261028BR11M9 (Mechanical Keyboard, Tracking BR2699817253BR) > Tracking has been stuck at 'inspeção na alfândega' for 6 days and CX is worried.",
    rows: [
      {
        section: "Greeting",
        english:
          "Hello! We sincerely apologize for the delay and for the frustration this has caused. We completely understand your concern.",
        portuguese:
          "Olá! Pedimos sinceras desculpas pela demora e pela frustração que isso causou. Entendemos completamente a sua preocupação.",
      },
      {
        section: "Current status",
        english:
          "We checked your tracking and can see that your order is currently undergoing import customs inspection in Brazil, which is standard for international shipments.",
        portuguese:
          "Verificamos o rastreamento e podemos ver que o seu pedido está atualmente em inspeção na alfândega de importação no Brasil, o que é padrão para envios internacionais.",
      },
      {
        section: "Explanation",
        english:
          "Customs inspections are conducted by local authorities and the timeframe varies depending on package volume. This is beyond the shop's direct control, but we are actively working to help.",
        portuguese:
          "As inspeções na alfândega são realizadas pelas autoridades locais e o prazo varia dependendo do volume de pacotes. Isso está fora do controle direto da loja, mas estamos trabalhando ativamente para ajudar.",
      },
      {
        section: "Required follow-up",
        english:
          "Please rest assured that we follow up this to courier and we expedite follow your order to courier to check the customs status and request the fastest possible release.",
        portuguese:
          "Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora para verificar a situação na alfândega e solicitar a liberação mais rápida possível.",
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "No worries—any delivery date shown is only an estimate, as international orders usually arrive within 5–14 days. Rest assured your order has not been lost and your payment remains protected by Shopee Guarantee while awaiting final customs clearance before local distribution.",
        portuguese:
          "Fique tranquilo, pois qualquer data exibida é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias. O seu pedido não foi perdido e o seu pagamento continua protegido pela Garantia Shopee enquanto aguarda a liberação final da alfândega antes da distribuição local.",
        highlight: true,
      },
      {
        section: "Closing",
        english:
          "We truly appreciate your patience and understanding. We will do everything we can from our side.",
        portuguese:
          "Agradecemos sinceramente a sua paciência e compreensão. Faremos tudo o que pudermos do nosso lado.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Initial Customs Update & Follow-Up",
        cxTrigger: "CX asks why order is stuck in customs inspection",
        rows: [
          {
            section: "Greeting",
            english:
              "Hello! We sincerely apologize for the delay and for the frustration this has caused. We completely understand your concern.",
            portuguese:
              "Olá! Pedimos sinceras desculpas pela demora e pela frustração que isso causou. Entendemos completamente a sua preocupação.",
          },
          {
            section: "Current status",
            english:
              "We checked your tracking and can see that your order is currently undergoing import customs inspection in Brazil, which is standard for international shipments.",
            portuguese:
              "Verificamos o rastreamento e podemos ver que o seu pedido está atualmente em inspeção na alfândega de importação no Brasil, o que é padrão para envios internacionais.",
          },
          {
            section: "Required follow-up",
            english:
              "Please rest assured that we follow up this to courier and we expedite follow your order to courier to check the customs status and request the fastest possible release.",
            portuguese:
              "Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora para verificar a situação na alfândega e solicitar a liberação mais rápida possível.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "No worries—any delivery date shown is only an estimate, as international orders usually arrive within 5–14 days. Rest assured your order has not been lost and your payment remains protected by Shopee Guarantee while awaiting final customs clearance before local distribution.",
            portuguese:
              "Fique tranquilo, pois qualquer data exibida é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias. O seu pedido não foi perdido e o seu pagamento continua protegido pela Garantia Shopee enquanto aguarda a liberação final da alfândega antes da distribuição local.",
            highlight: true,
          },
          {
            section: "Closing",
            english: "We truly appreciate your patience and understanding.",
            portuguese: "Agradecemos sinceramente a sua paciência e compreensão.",
          },
        ],
      },
      {
        id: "asks-refund",
        label: "2. CX Asks for Refund While in Customs",
        cxTrigger: "CX asks for a refund while package is still at customs",
        rows: [
          {
            section: "Follow-up & Policy",
            english:
              "We understand your frustration—please rest assured we follow up this to courier and we expedite follow your order to courier, and note that our store does not issue direct refunds since all refunds happen through Shopee.",
            portuguese:
              "Entendemos a sua frustração — fique tranquilo pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora, e observe que a nossa loja não realiza reembolsos diretos, pois todos ocorrem pela Shopee.",
            highlight: true,
          },
          {
            section: "Refund timing",
            english:
              'If your order is still within the estimated delivery date, you may refuse delivery upon arrival or submit a request via Shopee\'s webform (https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=); if beyond the estimated date, you can tap "Return/Refund" directly in the Shopee app.',
            portuguese:
              'Se ainda estiver dentro do prazo estimado de entrega, você pode recusar na entrega ou solicitar pelo formulário da Shopee (https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=); se já passou do prazo estimado, toque em "Devolução/Reembolso" diretamente no app da Shopee.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is protected by Shopee Guarantee and will be refunded immediately once processed.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee e será reembolsado imediatamente assim que processado.",
            highlight: true,
          },
        ],
      },
    ],
  },
  {
    id: "s4",
    number: 4,
    title: "Delivery Time Inquiry (In Transit)",
    category: ScenarioCategory.GENERAL,
    whenToUse:
      'CX asks "when does it arrive?" or "where is my order?" while the order is in transit or experiencing a minor courier delay.',
    policyRule:
      "Share latest update, assigned courier, estimated delivery date, tracking number, inform that we follow up with the assigned courier, and provide warm reassurance.",
    guideIds: ["find-order"],
    sampleInput: `Order SN:
2610097GCAVNED
DRAGON RANEE Lip Gloss 4 Pcs Conjunto Caixa
Shipping Tracking No
AJ261009127752101
Shipping Carrier Name
Expresso padrão
Estimated Delivery Time
2026-11-24 01:45 +0800
Latest Logistic Status
Picked_Up
Latest Logistic Date
2026-11-03 09:10 +0800
Um imprevisto ocorreu, mas fique tranquilo, seu pedido seguirá para tentativa de entrega no seu endereço em Manaus / AM

CX> when does it arrives?
inform that we will follow up this to the courier assigned and provide assurance`,
    rows: [
      {
        section: "Greeting",
        english: "Hello! Thank you for reaching out. We are happy to provide an update on your order.",
        portuguese: "Olá! Obrigado por entrar em contato. Temos prazer em fornecer uma atualização sobre o seu pedido.",
      },
      {
        section: "Current status",
        english:
          "Your order is currently in transit. According to our system, the latest update was on [DATE], and the package is on its way with the assigned courier for delivery to your address.",
        portuguese:
          "O seu pedido está atualmente em trânsito. De acordo com o nosso sistema, a última atualização foi em [DATA], e o pacote está a caminho com a transportadora responsável para entrega no seu endereço.",
      },
      {
        section: "Normal gap",
        english:
          "It is completely normal for international shipments to have a gap in tracking updates while traveling between countries. The next update usually appears once the package arrives at the next hub.",
        portuguese:
          "É completamente normal que envios internacionais tenham uma lacuna nas atualizações de rastreamento enquanto viajam entre países. A próxima atualização normalmente aparece quando o pacote chega ao próximo centro.",
      },
      {
        section: "Courier follow-up",
        english:
          "Please rest assured that we follow up this to courier and we expedite follow your order to courier assigned to monitor the delivery progress closely.",
        portuguese:
          "Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora responsável para acompanhar de perto o andamento da entrega.",
        highlight: true,
      },
      {
        section: "Assurance & Est. Delivery",
        english:
          "No worries—the estimated delivery date ([DATE]) is only an estimate, as international orders usually arrive within 5–14 days. Rest assured your package is safe and your payment is protected by Shopee Guarantee while it completes the final route.",
        portuguese:
          "Fique tranquilo, pois a data estimada de entrega ([DATA]) é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias. O seu pacote está seguro e o seu pagamento é protegido pela Garantia Shopee enquanto ele conclui a rota final.",
        highlight: true,
      },
      {
        section: "Tracking",
        english: "You can continue tracking your order using tracking number [TRACKING].",
        portuguese: "Você pode continuar acompanhando o seu pedido usando o número de rastreamento [RASTREAMENTO].",
      },
      {
        section: "Closing",
        english: "If you do not receive your order by the estimated date, please contact us again so we can assist you further.",
        portuguese: "Se você não receber o seu pedido até a data estimada, por favor, entre em contato conosco novamente para que possamos ajudar.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Initial Delivery Update & Follow-Up",
        cxTrigger: "CX asks when the order will arrive while in transit",
        rows: [
          {
            section: "Greeting",
            english: "Hello! Thank you for reaching out. We are happy to provide an update on your order.",
            portuguese: "Olá! Obrigado por entrar em contato. Temos prazer em fornecer uma atualização sobre o seu pedido.",
          },
          {
            section: "Current status",
            english:
              "Your order is currently in transit. According to our system, the latest update was on [DATE], and the package is on its way with the assigned courier for delivery to your address.",
            portuguese:
              "O seu pedido está atualmente em trânsito. De acordo com o nosso sistema, a última atualização foi em [DATA], e o pacote está a caminho com a transportadora responsável para entrega no seu endereço.",
          },
          {
            section: "Normal gap",
            english:
              "It is completely normal for international shipments to have a gap in tracking updates while traveling between countries. The next update usually appears once the package arrives at the next hub.",
            portuguese:
              "É completamente normal que envios internacionais tenham uma lacuna nas atualizações de rastreamento enquanto viajam entre países. A próxima atualização normalmente aparece quando o pacote chega ao próximo centro.",
          },
          {
            section: "Courier follow-up",
            english:
              "Please rest assured that we follow up this to courier and we expedite follow your order to courier assigned to monitor the delivery progress closely.",
            portuguese:
              "Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora responsável para acompanhar de perto o andamento da entrega.",
            highlight: true,
          },
          {
            section: "Assurance & Est. Delivery",
            english:
              "No worries—the estimated delivery date ([DATE]) is only an estimate, as international orders usually arrive within 5–14 days. Rest assured your package is safe and your payment is protected by Shopee Guarantee while it completes the final route.",
            portuguese:
              "Fique tranquilo, pois a data estimada de entrega ([DATA]) é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias. O seu pacote está seguro e o seu pagamento é protegido pela Garantia Shopee enquanto ele conclui a rota final.",
            highlight: true,
          },
          {
            section: "Tracking",
            english: "You can continue tracking your order using tracking number [TRACKING].",
            portuguese: "Você pode continuar acompanhando o seu pedido usando o número de rastreamento [RASTREAMENTO].",
          },
          {
            section: "Closing",
            english: "If you do not receive your order by the estimated date, please contact us again so we can assist you further.",
            portuguese: "Se você não receber o seu pedido até a data estimada, por favor, entre em contato conosco novamente para que possamos ajudar.",
          },
        ],
      },
      {
        id: "still-delayed",
        label: "2. CX Asks Again / Wants to Cancel or Refund",
        cxTrigger: "CX replies that they cannot wait longer and wants options",
        rows: [
          {
            section: "Courier follow-up",
            english:
              "We completely understand—we follow up this to courier and we expedite follow your order to courier so they prioritize your delivery attempt.",
            portuguese:
              "Entendemos perfeitamente — nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora para priorizar a tentativa de entrega.",
            highlight: true,
          },
          {
            section: "Options by delivery window",
            english:
              'If you prefer not to wait while still within the estimated delivery date ([DATE]), you may refuse the delivery upon arrival or submit a request via Shopee\'s webform (https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=); once beyond the estimated date, you can tap "Return/Refund" in the Shopee app.',
            portuguese:
              'Caso prefira não aguardar enquanto ainda está dentro da data estimada ([DATA]), você pode recusar na entrega ou solicitar pelo formulário da Shopee (https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=); após a data estimada, pode tocar em "Devolução/Reembolso" no aplicativo da Shopee.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is completely protected by Shopee Guarantee until you receive your order or receive your refund.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está totalmente protegido pela Garantia Shopee até você receber o seu pedido ou o seu reembolso.",
            highlight: true,
          },
        ],
      },
    ],
  },
  {
    id: "s5",
    number: 5,
    title: "Delivered but Not Received",
    category: ScenarioCategory.DELIVERY,
    whenToUse:
      'Tracking shows "DELIVERED" but CX says they never received the package.',
    policyRule:
      "Clarify we are only the seller, ask CX to check with neighbors/family/concierge, and instruct them to tap Return/Refund (Devolução/Reembolso) in Shopee.",
    guideIds: ["return-refund", "contact-shopee-cs", "refund-sla"],
    sampleInput:
      "Order #261101BR77L4 (Bluetooth Earbuds) > Status shows Delivered yesterday, but customer says nobody delivered anything to their house.",
    rows: [
      {
        section: "Greeting",
        english: "Good morning! We sincerely apologize for the confusion regarding your delivery.",
        portuguese: "Bom dia! Pedimos sinceras desculpas pela confusão em relação à sua entrega.",
      },
      {
        section: "Seller limitation",
        english:
          "Please kindly note that we are only the seller. Once shipped, delivery is handled by the courier and Shopee's system. We cannot intercept or directly resolve delivery issues.",
        portuguese:
          "Por favor, observe que somos apenas o vendedor. Uma vez enviado, a entrega é tratada pela transportadora e pelo sistema da Shopee. Não podemos interceptar ou resolver diretamente problemas de entrega.",
        highlight: true,
      },
      {
        section: "Local check",
        english:
          "We kindly ask you to check with neighbors, family, building concierge, or anyone at your address who may have received it.",
        portuguese:
          "Pedimos gentilmente que verifique com vizinhos, familiares, porteiro do prédio ou qualquer pessoa no seu endereço que possa ter recebido o pacote.",
      },
      {
        section: "Return/Refund instruction",
        english:
          'If you cannot locate your package after checking, please tap the "Return/Refund" button directly in the Shopee app so Shopee\'s protection team can investigate.',
        portuguese:
          'Se você não conseguir localizar o pacote após verificar, por favor, toque no botão "Devolução/Reembolso" diretamente no aplicativo da Shopee para que a equipe de proteção da Shopee possa investigar.',
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Rest assured your money is protected by Shopee Guarantee—once Shopee's protection team reviews and accepts your Return/Refund claim, your money will be refunded immediately.",
        portuguese:
          "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que a equipe de proteção da Shopee analisar e aceitar a sua solicitação de Devolução/Reembolso, o valor será reembolsado imediatamente.",
        highlight: true,
      },
      {
        section: "Closing",
        english: "We truly regret the inconvenience and appreciate your understanding.",
        portuguese: "Lamentamos sinceramente o inconveniente e agradecemos a sua compreensão.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Initial Check (Neighbors / Return/Refund)",
        cxTrigger: "Tracking shows Delivered, CX says they have not received it",
        rows: [
          {
            section: "Greeting",
            english: "Good morning! We sincerely apologize for the confusion regarding your delivery.",
            portuguese: "Bom dia! Pedimos sinceras desculpas pela confusão em relação à sua entrega.",
          },
          {
            section: "Seller limitation",
            english:
              "Please kindly note that we are only the seller. Once shipped, delivery is handled by the courier and Shopee's system. We cannot intercept or directly resolve delivery issues.",
            portuguese:
              "Por favor, observe que somos apenas o vendedor. Uma vez enviado, a entrega é tratada pela transportadora e pelo sistema da Shopee. Não podemos interceptar ou resolver diretamente problemas de entrega.",
            highlight: true,
          },
          {
            section: "Local check",
            english:
              "We kindly ask you to check with neighbors, family, building concierge, or anyone at your address who may have received it.",
            portuguese:
              "Pedimos gentilmente que verifique com vizinhos, familiares, porteiro do prédio ou qualquer pessoa no seu endereço que possa ter recebido o pacote.",
          },
          {
            section: "Return/Refund instruction",
            english:
              'If you cannot locate your package after checking, please tap the "Return/Refund" button directly in the Shopee app so Shopee\'s protection team can investigate.',
            portuguese:
              'Se você não conseguir localizar o pacote após verificar, por favor, toque no botão "Devolução/Reembolso" diretamente no aplicativo da Shopee para que a equipe de proteção da Shopee possa investigar.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is protected by Shopee Guarantee—once Shopee's protection team reviews and accepts your Return/Refund claim, your money will be refunded immediately.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que a equipe de proteção da Shopee analisar e aceitar a sua solicitação de Devolução/Reembolso, o valor será reembolsado imediatamente.",
            highlight: true,
          },
          {
            section: "Closing",
            english: "We truly regret the inconvenience and appreciate your understanding.",
            portuguese: "Lamentamos sinceramente o inconveniente e agradecemos a sua compreensão.",
          },
        ],
      },
      {
        id: "not-found",
        label: "2. CX Checked & Still Not Found",
        cxTrigger: "CX confirms nobody nearby received it and wants their refund",
        rows: [
          {
            section: "Acknowledgment",
            english: "Thank you for checking carefully around your address.",
            portuguese: "Obrigado por verificar com atenção ao redor do seu endereço.",
          },
          {
            section: "Return/Refund step",
            english:
              'Since it could not be located, please tap the "Return/Refund" button in your Shopee order details right away (choose "Did not receive order") so Shopee can open an investigation with the courier.',
            portuguese:
              'Como o pacote não foi localizado, por favor toque imediatamente no botão "Devolução/Reembolso" nos detalhes do pedido no aplicativo da Shopee (selecionando "Não recebi o pedido") para que a Shopee abra uma verificação com a transportadora.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is protected by Shopee Guarantee—once Shopee confirms the delivery issue and approves your claim, your full refund will be issued immediately.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que a Shopee confirmar o ocorrido na entrega e aprovar a solicitação, o reembolso integral será emitido imediatamente.",
            highlight: true,
          },
        ],
      },
    ],
  },
  {
    id: "s6",
    number: 6,
    title: "Refund Request (In Transit / Past Est. Delivery)",
    category: ScenarioCategory.REFUND,
    whenToUse:
      "CX asks for a refund while the order is in transit. Choose path based on whether it is beyond or still within the estimated delivery date.",
    policyRule:
      "Acknowledge latest tracking status + courier follow-up, clarify refunds are handled exclusively via Shopee, and provide Shopee Guarantee assurance (within Est. Delivery: refuse or webform; beyond Est. Delivery: tap Return/Refund).",
    guideIds: ["return-refund", "refund-sla"],
    sampleInput:
      "Order #261015BR90Z8 (Smartwatch Band) > Estimated delivery was Nov 8, no tracking update since Nov 2. Customer demands a full refund now.",
    rows: [
      {
        section: "Greeting",
        english: "Hello! We sincerely apologize for the delay and completely understand your frustration.",
        portuguese: "Olá! Pedimos sinceras desculpas pela demora e entendemos perfeitamente a sua frustração.",
      },
      {
        section: "Latest tracking & follow-up",
        english:
          "We checked your tracking and see the latest update was on [DATE]. Please rest assured that we follow up this to courier and we expedite follow your order to courier to investigate the current status.",
        portuguese:
          "Verificamos o rastreamento e vimos que a última atualização foi em [DATA]. Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora para verificar a situação atual.",
        highlight: true,
      },
      {
        section: "Refund instruction (Beyond Est.)",
        english:
          'Please note that refunds are handled exclusively through Shopee and our store does not issue direct refunds. Since your order is beyond the estimated delivery date, please tap the "Return/Refund" button directly in your Shopee app to receive your refund.',
        portuguese:
          'Por favor, observe que os reembolsos são tratados exclusivamente pela Shopee e a nossa loja não realiza reembolsos diretos. Como o seu pedido já ultrapassou a data estimada de entrega, por favor toque no botão "Devolução/Reembolso" diretamente no seu aplicativo da Shopee para receber o seu reembolso.',
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Rest assured your money is protected by Shopee Guarantee—once your Return/Refund request is reviewed and accepted by Shopee, your money will be refunded immediately.",
        portuguese:
          "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que a sua solicitação de Devolução/Reembolso for analisada e aceita pela Shopee, o seu dinheiro será reembolsado imediatamente.",
        highlight: true,
      },
      {
        section: "Closing",
        english: "We truly appreciate your patience and understanding.",
        portuguese: "Agradecemos sinceramente a sua paciência e compreensão.",
      },
    ],
    paths: [
      {
        id: "beyond-est",
        label: "1. Beyond Est. Delivery (Tap Return/Refund)",
        cxTrigger: "Order is already past/beyond the estimated delivery date and CX asks for a refund",
        rows: [
          {
            section: "Greeting",
            english: "Hello! We sincerely apologize for the delay and completely understand your frustration.",
            portuguese: "Olá! Pedimos sinceras desculpas pela demora e entendemos perfeitamente a sua frustração.",
          },
          {
            section: "Latest tracking & follow-up",
            english:
              "We checked your tracking and see the latest update was on [DATE]. Please rest assured that we follow up this to courier and we expedite follow your order to courier to investigate the current status.",
            portuguese:
              "Verificamos o rastreamento e vimos que a última atualização foi em [DATA]. Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora para verificar a situação atual.",
            highlight: true,
          },
          {
            section: "Refund instruction (Beyond Est.)",
            english:
              'Please note that refunds are handled exclusively through the Shopee app\'s "Return/Refund" button and our store does not issue direct refunds. Since your order is beyond the estimated delivery date, please tap the "Return/Refund" button directly in your Shopee app to get your refund.',
            portuguese:
              'Por favor, observe que os reembolsos são tratados exclusivamente pelo botão "Devolução/Reembolso" no aplicativo da Shopee e a nossa loja não realiza reembolsos diretos. Como o seu pedido já passou da data estimada de entrega, toque no botão "Devolução/Reembolso" diretamente no aplicativo da Shopee para receber o seu reembolso.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is protected by Shopee Guarantee—once your Return/Refund request is reviewed and accepted by Shopee, your money will be refunded immediately.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que a sua solicitação de Devolução/Reembolso for analisada e aceita pela Shopee, o seu dinheiro será reembolsado imediatamente.",
            highlight: true,
          },
          {
            section: "Closing",
            english: "We truly appreciate your patience and understanding.",
            portuguese: "Agradecemos sinceramente a sua paciência e compreensão.",
          },
        ],
      },
      {
        id: "within-est",
        label: "2. In Transit Within Est. Delivery (Refuse or Webform)",
        cxTrigger: "Order is still in transit and within the estimated delivery date when CX asks for a refund",
        rows: [
          {
            section: "Greeting",
            english: "Hello! Thank you for reaching out, and we completely understand your concern.",
            portuguese: "Olá! Obrigado por entrar em contato e entendemos perfeitamente a sua preocupação.",
          },
          {
            section: "Latest tracking & follow-up",
            english:
              "Your order (tracking [TRACKING]) is still in transit—the latest update was on [DATE] with an estimated delivery date of [DATE], and rest assured we follow up this to courier and we expedite follow your order to courier.",
            portuguese:
              "O seu pedido (rastreamento [RASTREAMENTO]) ainda está em trânsito — a última atualização foi em [DATA], com entrega estimada para [DATA], e fique tranquilo pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora.",
            highlight: true,
          },
          {
            section: "Refund instruction (Within Est.)",
            english:
              'Please note that refunds are handled exclusively through Shopee (via the Shopee app\'s "Return/Refund" process) and our store cannot issue direct refunds. Since your order is still in transit within the estimated delivery date, you can kindly refuse the package upon delivery or request cancellation/refund through Shopee\'s official webform:',
            portuguese:
              'Por favor, observe que os reembolsos são tratados exclusivamente pela Shopee (pelo processo de "Devolução/Reembolso" no aplicativo da Shopee) e a nossa loja não consegue realizar reembolsos diretos. Como o seu pedido ainda está em trânsito dentro do prazo estimado de entrega, você pode recusar o pacote no momento da entrega ou solicitar pelo formulário oficial da Shopee:',
            highlight: true,
          },
          {
            section: "Shopee webform link",
            english:
              "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
            portuguese:
              "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is protected by Shopee Guarantee—once you refuse the order upon delivery or your request via Shopee is accepted, your money will be refunded immediately.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que você recusar o pedido na entrega ou a sua solicitação pela Shopee for aceita, o seu dinheiro será reembolsado imediatamente.",
            highlight: true,
          },
          {
            section: "Closing",
            english: "We appreciate your understanding and remain here if you need any further assistance.",
            portuguese: "Agradecemos a sua compreensão e permanecemos à disposição se precisar de mais alguma ajuda.",
          },
        ],
      },
    ],
  },
  {
    id: "s7",
    number: 7,
    title: "Cancel Order (Already Shipped)",
    category: ScenarioCategory.REFUND,
    whenToUse:
      "CX wants to cancel after the order has already been picked up / shipped (PICKUP_DONE / Picked_Up). Store cannot cancel or refund directly.",
    policyRule:
      "Explain store cannot cancel shipped orders or issue direct refunds; the only way is to refuse delivery upon arrival (or tap Return/Refund when available) or request via Shopee's webform.",
    guideIds: ["return-refund", "refund-sla"],
    sampleInput: `Order SN:
26111135ENC0T2
Ampola Grow Turn para Cuidados com o Couro Cabeludo Cabelo Hidratante 100ml 3,38oz
Shipping Tracking No
BR260965501384Q
Shipping Carrier Name
Expresso padrão
Shipping Logistics Status
PICKUP_DONE
Estimated Delivery Time
2026-12-04 01:41 +0800
Latest Logistic Status
Picked_Up
Latest Logistic Date
2026-11-13 00:08 +0800
Ship Out Date
2026-11-14 00:00 +0800

CX> Cancel order`,
    rows: [
      {
        section: "Greeting & Policy",
        english:
          "Hello! Thank you for contacting us. Please kindly note that our store cannot cancel orders or offer full refunds directly, as all transactions happen inside Shopee.",
        portuguese:
          "Olá! Obrigado por entrar em contato conosco. Por favor, observe que a nossa loja não consegue cancelar pedidos nem realizar reembolsos integrais diretamente, pois todas as transações acontecem na Shopee.",
        highlight: true,
      },
      {
        section: "Already shipped",
        english:
          'Since your order (tracking [TRACKING]) has already been shipped out, the only way to cancel is to kindly refuse the package at the time of delivery (or tap "Return/Refund" when available) or submit a cancellation request through Shopee\'s official webform:',
        portuguese:
          'Como o seu pedido (rastreamento [RASTREAMENTO]) já foi enviado, a única forma de cancelar é recusar o pacote no momento da entrega (ou tocar em "Devolução/Reembolso" quando disponível) ou enviar uma solicitação de cancelamento pelo formulário oficial da Shopee:',
        highlight: true,
      },
      {
        section: "Shopee webform link",
        english:
          "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
        portuguese:
          "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Rest assured your money is protected by Shopee Guarantee—once you refuse the order upon delivery or your request to cancel has been accepted, your money will be refunded immediately.",
        portuguese:
          "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que você recusar o pedido na entrega ou a sua solicitação de cancelamento for aceita, o seu dinheiro será reembolsado imediatamente.",
        highlight: true,
      },
      {
        section: "Closing",
        english: "We apologize for any inconvenience and appreciate your understanding.",
        portuguese: "Pedimos desculpas por qualquer inconveniente e agradecemos a sua compreensão.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Initial Reply (Refuse or Webform)",
        cxTrigger: "CX asks to cancel while order has already been shipped out",
        rows: [
          {
            section: "Greeting & Policy",
            english:
              "Hello! Thank you for contacting us. Please kindly note that our store cannot cancel orders or offer full refunds directly, as all transactions happen inside Shopee.",
            portuguese:
              "Olá! Obrigado por entrar em contato conosco. Por favor, observe que a nossa loja não consegue cancelar pedidos nem realizar reembolsos integrais diretamente, pois todas as transações acontecem na Shopee.",
            highlight: true,
          },
          {
            section: "Already shipped",
            english:
              'Since your order (tracking [TRACKING]) has already been shipped out, the only way to cancel is to kindly refuse the package at the time of delivery (or tap "Return/Refund" when available) or submit a cancellation request through Shopee\'s official webform:',
            portuguese:
              'Como o seu pedido (rastreamento [RASTREAMENTO]) já foi enviado, a única forma de cancelar é recusar o pacote no momento da entrega (ou tocar em "Devolução/Reembolso" quando disponível) ou enviar uma solicitação de cancelamento pelo formulário oficial da Shopee:',
            highlight: true,
          },
          {
            section: "Shopee webform link",
            english:
              "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
            portuguese:
              "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is protected by Shopee Guarantee—once you refuse the order upon delivery or your request to cancel has been accepted, your money will be refunded immediately.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que você recusar o pedido na entrega ou a sua solicitação de cancelamento for aceita, o seu dinheiro será reembolsado imediatamente.",
            highlight: true,
          },
          {
            section: "Closing",
            english: "We apologize for any inconvenience and appreciate your understanding.",
            portuguese: "Pedimos desculpas por qualquer inconveniente e agradecemos a sua compreensão.",
          },
        ],
      },
      {
        id: "after-refusal",
        label: "2. CX Already Refused / Asks When Refund Arrives",
        cxTrigger: "CX confirms they refused the delivery and asks when the refund arrives",
        rows: [
          {
            section: "Confirmation",
            english: "Thank you for letting us know you have already refused the package upon delivery!",
            portuguese: "Obrigado por nos avisar que você já recusou o pacote no momento da entrega!",
          },
          {
            section: "Refund process",
            english:
              "Once the courier updates the tracking to indicate refusal/return in transit, Shopee automatically processes the cancellation and refund back to your original payment method.",
            portuguese:
              "Assim que a transportadora atualizar o rastreamento indicando a recusa/devolução ao remetente, a Shopee processa automaticamente o cancelamento e o reembolso para o seu método de pagamento original.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is 100% protected by Shopee Guarantee and will be refunded immediately once the refusal status is updated by Shopee.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está 100% protegido pela Garantia Shopee e será reembolsado imediatamente assim que o status da recusa for atualizado pela Shopee.",
            highlight: true,
          },
        ],
      },
    ],
  },
  {
    id: "s8",
    number: 8,
    title: "Received, Tracking Not Updated",
    category: ScenarioCategory.DELIVERY,
    whenToUse:
      'CX confirms they physically have the item, but tracking still shows "in transit" or not delivered.',
    policyRule: "Positive situation—reassure that driver scanning updates shortly.",
    sampleInput:
      "Order #261109BR22W5 (Desk Lamp) > CX messaged saying they already received the lamp today, but the app still says in transit.",
    rows: [
      {
        section: "Acknowledgment",
        english: "Hello! Thank you for confirming that you have already received your order.",
        portuguese: "Olá! Obrigado por confirmar que já recebeu o seu pedido.",
      },
      {
        section: "Reassurance",
        english:
          "No worries! Sometimes the driver needs a little time to scan and tag the order as delivered in the system. The tracking should update soon.",
        portuguese:
          "Fique tranquilo! Às vezes o entregador precisa de um pouco de tempo para escanear e marcar o pedido como entregue no sistema. O rastreamento deve atualizar em breve.",
        highlight: true,
      },
      {
        section: "Closing",
        english: "We are glad your order arrived safely. If you need anything else, feel free to contact us.",
        portuguese:
          "Ficamos felizes que o seu pedido chegou em segurança. Se precisar de mais alguma coisa, sinta-se à vontade para entrar em contato.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Driver Scan Reassurance",
        cxTrigger: "CX received the package, tracking has not updated yet",
        rows: [
          {
            section: "Acknowledgment",
            english: "Hello! Thank you for confirming that you have already received your order.",
            portuguese: "Olá! Obrigado por confirmar que já recebeu o seu pedido.",
          },
          {
            section: "Reassurance",
            english:
              "No worries! Sometimes the driver needs a little time to scan and tag the order as delivered in the system. The tracking should update soon.",
            portuguese:
              "Fique tranquilo! Às vezes o entregador precisa de um pouco de tempo para escanear e marcar o pedido como entregue no sistema. O rastreamento deve atualizar em breve.",
            highlight: true,
          },
          {
            section: "Closing",
            english: "We are glad your order arrived safely. If you need anything else, feel free to contact us.",
            portuguese:
              "Ficamos felizes que o seu pedido chegou em segurança. Se precisar de mais alguma coisa, sinta-se à vontade para entrar em contato.",
          },
        ],
      },
      {
        id: "confirm-received",
        label: "2. CX Asks How to Confirm Delivery",
        cxTrigger: "CX asks how to mark the order as received in the app",
        rows: [
          {
            section: "Guidance",
            english:
              'Once the courier updates the status to Delivered in the app, you will see the "Order Received" button on your order page—you can tap it anytime after inspecting your item.',
            portuguese:
              'Assim que a transportadora atualizar o status para Entregue no aplicativo, o botão "Pedido Recebido" aparecerá na página do seu pedido — você poderá tocá-lo após conferir o item.',
            highlight: true,
          },
          {
            section: "Closing",
            english: "Thank you for shopping with us, and please enjoy your purchase!",
            portuguese: "Obrigado por comprar conosco e aproveite muito a sua compra!",
          },
        ],
      },
    ],
  },
  {
    id: "s9",
    number: 9,
    title: "Delivery Time Preference",
    category: ScenarioCategory.GENERAL,
    whenToUse:
      'CX says "I am at home at 4pm" or gives a preferred delivery time window.',
    policyRule: "Clarify sellers do not control courier schedules or routes.",
    sampleInput:
      "Order #261111BR60C3 (Webcam HD) > CX asks if we can deliver only after 5 PM when they get home from work.",
    rows: [
      {
        section: "Acknowledgment",
        english: "Hello! Thank you for letting us know your availability.",
        portuguese: "Olá! Obrigado por nos informar sobre a sua disponibilidade.",
      },
      {
        section: "Clarification",
        english:
          "Please kindly note that as the seller, we do not have control over the courier's delivery route or specific delivery times. The local courier determines the schedule.",
        portuguese:
          "Por favor, observe que, como vendedor, não temos controle sobre a rota da transportadora ou horários específicos de entrega. A transportadora local determina o cronograma.",
        highlight: true,
      },
      {
        section: "Status",
        english:
          "Your order is currently [STATUS]. The estimated delivery date is [DATE]. It will still take some time before local delivery begins.",
        portuguese:
          "O seu pedido está atualmente [STATUS]. A data estimada de entrega é [DATA]. Ainda levará algum tempo antes que a entrega local comece.",
      },
      {
        section: "Tracking advice",
        english:
          'We recommend continuing to track with [TRACKING]. Once it shows "out for delivery," the courier is approaching.',
        portuguese:
          'Recomendamos continuar acompanhando com [RASTREAMENTO]. Assim que mostrar "saiu para entrega," o entregador está se aproximando.',
      },
      {
        section: "Assurance",
        english:
          "Rest assured your order is safe and protected by Shopee Guarantee; if a delivery attempt is missed while you are away, the courier normally performs additional delivery attempts.",
        portuguese:
          "Fique tranquilo, pois o seu pedido está seguro e protegido pela Garantia Shopee; caso uma tentativa de entrega não seja concluída na sua ausência, a transportadora normalmente realiza novas tentativas.",
      },
      {
        section: "Closing",
        english: "We appreciate your understanding and patience.",
        portuguese: "Agradecemos a sua compreensão e paciência.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Courier Schedule Policy & Status",
        cxTrigger: "CX asks for delivery at a specific hour/window",
        rows: [
          {
            section: "Acknowledgment",
            english: "Hello! Thank you for letting us know your availability.",
            portuguese: "Olá! Obrigado por nos informar sobre a sua disponibilidade.",
          },
          {
            section: "Clarification",
            english:
              "Please kindly note that as the seller, we do not have control over the courier's delivery route or specific delivery times. The local courier determines the schedule.",
            portuguese:
              "Por favor, observe que, como vendedor, não temos controle sobre a rota da transportadora ou horários específicos de entrega. A transportadora local determina o cronograma.",
            highlight: true,
          },
          {
            section: "Status & Tracking",
            english:
              "Your order is currently [STATUS] with estimated delivery on [DATE], and you can track it with [TRACKING].",
            portuguese:
              "O seu pedido está atualmente [STATUS] com entrega estimada para [DATA], e você pode acompanhá-lo com [RASTREAMENTO].",
          },
          {
            section: "Assurance",
            english:
              "Rest assured your order is safe and protected by Shopee Guarantee; if a delivery attempt is missed while you are away, the courier normally performs additional delivery attempts.",
            portuguese:
              "Fique tranquilo, pois o seu pedido está seguro e protegido pela Garantia Shopee; caso uma tentativa de entrega não seja concluída na sua ausência, a transportadora normalmente realiza novas tentativas.",
          },
        ],
      },
      {
        id: "missed-attempt",
        label: "2. CX Missed Delivery Attempt",
        cxTrigger: "CX says the courier came while they were not home",
        rows: [
          {
            section: "Reassurance",
            english:
              "No worries! Standard couriers usually make up to 2–3 delivery attempts on the following business days.",
            portuguese:
              "Não se preocupe! As transportadoras costumam realizar de 2 a 3 tentativas de entrega nos próximos dias úteis.",
            highlight: true,
          },
          {
            section: "Follow-up & Assurance",
            english:
              "Please keep tracking [TRACKING] and leave someone at the address if possible—rest assured your order and payment remain protected by Shopee Guarantee.",
            portuguese:
              "Por favor, acompanhe pelo código [RASTREAMENTO] e, se possível, deixe alguém autorizado para receber — fique tranquilo pois o seu pedido e pagamento continuam protegidos pela Garantia Shopee.",
          },
        ],
      },
    ],
  },
  {
    id: "s10",
    number: 10,
    title: "Product Specification Question",
    category: ScenarioCategory.PRODUCT,
    whenToUse:
      "CX asks about product details (size, voltage, material, compatibility). Answer strictly from the listing.",
    policyRule: "Never invent specs; cite the product listing description only.",
    sampleInput:
      "Product: Electric Milk Frother 500ml > CX asks whether it works on 110V or 220V (bivolt) and if the pitcher is stainless steel.",
    rows: [
      {
        section: "Greeting",
        english: "Hello! Thank you for your interest in this product.",
        portuguese: "Olá! Obrigado pelo seu interesse neste produto.",
      },
      {
        section: "Honest answer",
        english:
          "According to the product page listing, [INSERT SPEC FROM PAGE]. Please note that we kindly ask you to check the product description on the listing for full details.",
        portuguese:
          "De acordo com a descrição da página do produto, [INSERIR ESPECIFICAÇÃO DA PÁGINA]. Por favor, observe que pedimos gentilmente que verifique a descrição do produto na listagem para detalhes completos.",
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Rest assured your purchase is protected by Shopee Guarantee, and we are always here to help if you need anything else.",
        portuguese:
          "Fique tranquilo, pois a sua compra está protegida pela Garantia Shopee e estamos sempre à disposição para ajudar no que precisar.",
      },
      {
        section: "Closing",
        english: "If you have any other questions after reviewing the product page, please feel free to ask.",
        portuguese: "Se tiver mais alguma dúvida após revisar a página do produto, sinta-se à vontade para perguntar.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Share Listing Spec Honestly",
        cxTrigger: "Product specification is shown on the listing/order info",
        rows: [
          {
            section: "Greeting",
            english: "Hello! Thank you for your interest in this product.",
            portuguese: "Olá! Obrigado pelo seu interesse neste produto.",
          },
          {
            section: "Honest answer",
            english:
              "According to the product page listing, [INSERT SPEC FROM PAGE]. Please note that we kindly ask you to check the product description on the listing for full details.",
            portuguese:
              "De acordo com a descrição da página do produto, [INSERIR ESPECIFICAÇÃO DA PÁGINA]. Por favor, observe que pedimos gentilmente que verifique a descrição do produto na listagem para detalhes completos.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your purchase is protected by Shopee Guarantee, and we are always here to help if you need anything else.",
            portuguese:
              "Fique tranquilo, pois a sua compra está protegida pela Garantia Shopee e estamos sempre à disposição para ajudar no que precisar.",
          },
          {
            section: "Closing",
            english: "If you have any other questions after reviewing the product page, please feel free to ask.",
            portuguese: "Se tiver mais alguma dúvida após revisar a página do produto, sinta-se à vontade para perguntar.",
          },
        ],
      },
      {
        id: "not-listed",
        label: "2. Spec Not Listed on Page",
        cxTrigger: "Specific measurement or detail is not mentioned in the listing",
        rows: [
          {
            section: "Transparent reply",
            english:
              "Thank you for asking! To be completely accurate and not mislead you, that specific detail is not listed on the product page, so we kindly recommend checking the full product description and photos on the listing before ordering.",
            portuguese:
              "Obrigado por perguntar! Para sermos totalmente transparentes e não passar uma informação incorreta, esse detalhe específico não consta na página do produto, por isso recomendamos verificar a descrição completa e as fotos do anúncio antes de comprar.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your purchase is protected by Shopee Guarantee, and we are always here to help if you need anything else.",
            portuguese:
              "Fique tranquilo, pois a sua compra está protegida pela Garantia Shopee e estamos sempre à disposição para ajudar no que precisar.",
          },
          {
            section: "Closing",
            english: "Please let us know if we can help with any other details shown on the product page!",
            portuguese: "Nos avise se pudermos ajudar com qualquer outro detalhe exibido na página do produto!",
          },
        ],
      },
    ],
  },
  {
    id: "s11",
    number: 11,
    title: "Out of Scope — Shopee Platform",
    category: ScenarioCategory.PLATFORM,
    whenToUse:
      "CX asks about Shopee Coins, ShopeePay, app bugs, account issues, vouchers, or platform disputes.",
    policyRule: "Politely clarify store scope and redirect to Shopee Help Center in the app.",
    guideIds: ["contact-shopee-cs", "voucher-wallet", "voucher-steps"],
    sampleInput:
      "Order #261112BR04V8 > Customer says their Pix payment failed twice and their Shopee Coins were deducted without applying the discount.",
    rows: [
      {
        section: "Greeting",
        english: "Hello! Thank you for reaching out to us.",
        portuguese: "Olá! Obrigado por entrar em contato conosco.",
      },
      {
        section: "Scope clarification",
        english:
          "We understand your concern. However, please kindly note that this matter is related to the Shopee platform itself and is outside our store's scope of support. As the seller, we only handle questions related to the products we sell and their shipping.",
        portuguese:
          "Entendemos a sua preocupação. No entanto, por favor, observe que esta questão está relacionada à própria plataforma da Shopee e está fora do alcance do suporte da nossa loja. Como vendedor, só lidamos com perguntas relacionadas aos produtos que vendemos e ao envio deles.",
        highlight: true,
      },
      {
        section: "Redirect to Shopee",
        english:
          "For questions about [ISSUE TOPIC], we kindly ask you to contact Shopee's official customer service directly through the Shopee app or website, as they are the ones who can properly assist you with platform-related matters.",
        portuguese:
          "Para questões sobre [ASSUNTO], pedimos gentilmente que entre em contato diretamente com o atendimento oficial da Shopee pelo aplicativo ou site da Shopee, pois eles são os responsáveis por ajudar adequadamente com assuntos relacionados à plataforma.",
        highlight: true,
      },
      {
        section: "How to contact Shopee",
        english:
          'You can access Shopee\'s help center by going to the "Me" tab in the Shopee app, then selecting "Help Center" or "Customer Service" to chat with Shopee\'s support team.',
        portuguese:
          'Você pode acessar o centro de ajuda da Shopee indo na aba "Eu" no aplicativo da Shopee e depois selecionando "Central de Ajuda" ou "Atendimento" para conversar com a equipe de suporte da Shopee.',
      },
      {
        section: "Assurance",
        english:
          "Rest assured your account and purchases are protected by Shopee Guarantee, and Shopee's support team can resolve platform matters directly for you.",
        portuguese:
          "Fique tranquilo, pois a sua conta e as suas compras estão protegidas pela Garantia Shopee e a equipe de suporte da Shopee poderá resolver essa questão diretamente para você.",
        highlight: true,
      },
      {
        section: "Closing",
        english: "We apologize for not being able to assist with this specific matter, and we appreciate your understanding.",
        portuguese:
          "Pedimos desculpas por não podermos ajudar com esta questão específica, e agradecemos a sua compreensão.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Redirect to Shopee Help Center",
        cxTrigger: "CX asks about Coins, ShopeePay, vouchers, or app/payment bugs",
        rows: [
          {
            section: "Greeting",
            english: "Hello! Thank you for reaching out to us.",
            portuguese: "Olá! Obrigado por entrar em contato conosco.",
          },
          {
            section: "Scope clarification",
            english:
              "We understand your concern. However, please kindly note that this matter is related to the Shopee platform itself and is outside our store's scope of support. As the seller, we only handle questions related to the products we sell and their shipping.",
            portuguese:
              "Entendemos a sua preocupação. No entanto, por favor, observe que esta questão está relacionada à própria plataforma da Shopee e está fora do alcance do suporte da nossa loja. Como vendedor, só lidamos com perguntas relacionadas aos produtos que vendemos e ao envio deles.",
            highlight: true,
          },
          {
            section: "Redirect to Shopee",
            english:
              'For questions about [ISSUE TOPIC], please contact Shopee\'s official customer service via the "Me" tab -> "Help Center" or "Customer Service" in the Shopee app.',
            portuguese:
              'Para questões sobre [ASSUNTO], pedimos gentilmente que entre em contato com o atendimento oficial da Shopee na aba "Eu" -> "Central de Ajuda" ou "Atendimento" no aplicativo da Shopee.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your account and purchases are protected by Shopee Guarantee, and Shopee's support team can resolve platform matters directly for you.",
            portuguese:
              "Fique tranquilo, pois a sua conta e as suas compras estão protegidas pela Garantia Shopee e a equipe de suporte da Shopee poderá resolver essa questão diretamente para você.",
            highlight: true,
          },
          {
            section: "Closing",
            english: "We apologize for not being able to assist with this specific matter, and we appreciate your understanding.",
            portuguese:
              "Pedimos desculpas por não podermos ajudar com esta questão específica, e agradecemos a sua compreensão.",
          },
        ],
      },
      {
        id: "how-to-chat",
        label: "2. CX Asks How to Open Shopee Chat",
        cxTrigger: "CX says they could not find where to contact Shopee support",
        rows: [
          {
            section: "Step-by-step",
            english:
              'In the Shopee app, tap "Me" at the bottom right -> scroll down to "Help Center" -> scroll to the bottom and tap "Chat with Shopee" to reach a live Shopee agent.',
            portuguese:
              'No aplicativo da Shopee, toque em "Eu" no canto inferior direito -> role até "Central de Ajuda" -> role até o final e toque em "Conversar com a Shopee" para falar com um atendente da plataforma.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured they have full access to your Shopee account and your purchases remain protected by Shopee Guarantee!",
            portuguese:
              "Fique tranquilo, pois eles têm acesso total à sua conta Shopee e as suas compras continuam protegidas pela Garantia Shopee!",
          },
        ],
      },
    ],
  },
  {
    id: "s12",
    number: 12,
    title: "Direct Refund / Cancel Policy",
    category: ScenarioCategory.REFUND,
    whenToUse:
      "CX asks the store directly for a full refund or cancellation outside the in-app flow.",
    policyRule:
      "Core store rule: We don't offer full refunds directly because all transactions happen in Shopee. Instruct CX to tap Return/Refund to cancel and get their refund.",
    guideIds: ["return-refund", "refund-sla"],
    sampleInput:
      "Order #261112BR19R2 (Ceramic Mug) > CX says: 'Can your store just send me a full refund via Pix and cancel my order?'",
    rows: [
      {
        section: "Greeting",
        english: "Hello! Thank you for contacting us, and we apologize for any inconvenience.",
        portuguese: "Olá! Obrigado por entrar em contato conosco e pedimos desculpas por qualquer inconveniente.",
      },
      {
        section: "No direct store refund",
        english: "Please kindly note that our store does not offer or process full refunds directly.",
        portuguese: "Por favor, observe que a nossa loja não oferece nem realiza reembolsos integrais diretamente.",
        highlight: true,
      },
      {
        section: "Shopee transactions",
        english: "All payments and financial transactions happen exclusively within Shopee's platform.",
        portuguese: "Todos os pagamentos e transações financeiras acontecem exclusivamente dentro da plataforma da Shopee.",
        highlight: true,
      },
      {
        section: "Tap Return/Refund",
        english:
          'To cancel your order and receive your refund, please go to your order details in the Shopee app and tap the "Return/Refund" button.',
        portuguese:
          'Para cancelar o seu pedido e receber o seu reembolso, por favor, acesse os detalhes do pedido no aplicativo da Shopee e toque no botão "Devolução/Reembolso".',
        highlight: true,
      },
      {
        section: "Platform review",
        english:
          "Once submitted, Shopee will review your request and process your refund directly through the platform.",
        portuguese:
          "Assim que enviado, a Shopee analisará a sua solicitação e processará o reembolso diretamente pela plataforma.",
      },
      {
        section: "Assurance",
        english:
          "Rest assured your money is protected by Shopee Guarantee—once your Return/Refund request is accepted, your money will be refunded immediately by Shopee.",
        portuguese:
          "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que a sua solicitação de Devolução/Reembolso for aceita, o seu dinheiro será reembolsado imediatamente pela Shopee.",
        highlight: true,
      },
      {
        section: "Closing",
        english: "Thank you very much for your understanding, and please let us know if you need any further assistance.",
        portuguese: "Muito obrigado pela sua compreensão e nos avise se precisar de mais alguma ajuda.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. No Direct Refund (Return/Refund Flow)",
        cxTrigger: "CX asks the store directly for a refund or cancellation",
        rows: [
          {
            section: "Greeting",
            english: "Hello! Thank you for contacting us, and we apologize for any inconvenience.",
            portuguese: "Olá! Obrigado por entrar em contato conosco e pedimos desculpas por qualquer inconveniente.",
          },
          {
            section: "No direct store refund",
            english:
              "Please kindly note that our store does not offer or process full refunds directly, as all payments and transactions happen exclusively within Shopee's platform.",
            portuguese:
              "Por favor, observe que a nossa loja não oferece nem realiza reembolsos integrais diretamente, pois todos os pagamentos e transações acontecem exclusivamente dentro da plataforma da Shopee.",
            highlight: true,
          },
          {
            section: "Tap Return/Refund",
            english:
              'To cancel your order and receive your refund, please go to your order details in the Shopee app and tap the "Return/Refund" button.',
            portuguese:
              'Para cancelar o seu pedido e receber o seu reembolso, por favor, acesse os detalhes do pedido no aplicativo da Shopee e toque no botão "Devolução/Reembolso".',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is protected by Shopee Guarantee—once your Return/Refund request is accepted, your money will be refunded immediately by Shopee.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que a sua solicitação de Devolução/Reembolso for aceita, o seu dinheiro será reembolsado imediatamente pela Shopee.",
            highlight: true,
          },
        ],
      },
      {
        id: "insists-pix",
        label: "2. CX Insists on Direct Pix / Bank Transfer",
        cxTrigger: "CX insists the store send a direct Pix transfer instead of Shopee",
        rows: [
          {
            section: "Firm policy",
            english:
              "We truly understand your preference, however Shopee's platform policy strictly prohibits sellers from sending direct Pix or external bank transfers.",
            portuguese:
              "Entendemos perfeitamente a sua preferência, porém as políticas da Shopee proíbem estritamente que vendedores façam transferências diretas via Pix ou conta bancária externa.",
            highlight: true,
          },
          {
            section: "Official Return/Refund",
            english:
              'All refunds are safely processed directly by Shopee through the "Return/Refund" button (or Shopee\'s official webform while in transit), guaranteeing your refund goes straight back to your original payment method.',
            portuguese:
              'Todos os reembolsos são processados com segurança diretamente pela Shopee pelo botão "Devolução/Reembolso" (ou pelo formulário oficial da Shopee em trânsito), garantindo que o valor volte direto para o seu meio de pagamento original.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is 100% protected by Shopee Guarantee throughout the entire process.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está 100% protegido pela Garantia Shopee durante todo o processo.",
            highlight: true,
          },
        ],
      },
    ],
  },
  {
    id: "s13",
    number: 13,
    title: "Cancel Order (In Preparation)",
    category: ScenarioCategory.REFUND,
    whenToUse:
      "CX asks to cancel while the order is still in preparation (not yet picked up or shipped out).",
    policyRule:
      "Inform we cannot cancel orders directly. Tell CX to tap Cancel Order; if unavailable, explain payment was distributed to Taxes + Shipping costs and direct to Shopee webform.",
    guideIds: ["cancel-order", "refund-sla"],
    sampleInput: `Order SN:
26111288PRE4K1
Ampola Grow Turn para Cuidados com o Couro Cabeludo 100ml
Shipping Logistics Status
ORDER_CREATED (In Preparation)

CX> Cancel order`,
    rows: [
      {
        section: "Greeting & Policy",
        english:
          "Hello! Thank you for contacting us. Please kindly note that our store is unable to cancel orders directly or issue direct refunds, as all transactions happen inside Shopee.",
        portuguese:
          "Olá! Obrigado por entrar em contato conosco. Por favor, observe que a nossa loja não consegue cancelar pedidos diretamente nem realizar reembolsos diretos, pois todas as transações acontecem dentro da Shopee.",
        highlight: true,
      },
      {
        section: "Tap Cancel Order",
        english:
          'Since your order is still in preparation, please kindly tap the "Cancel Order" button directly in your Shopee app.',
        portuguese:
          'Como o seu pedido ainda está em preparação, por favor, toque gentilmente no botão "Cancelar pedido" diretamente no aplicativo da Shopee.',
        highlight: true,
      },
      {
        section: "If button unavailable",
        english:
          "If the Cancel Order button is no longer available, it is because your payment has already been distributed to Taxes and Shipping costs—no worries, you can still request cancellation directly through Shopee's official webform below.",
        portuguese:
          "Se o botão de cancelamento não estiver mais disponível, é porque o seu pagamento já foi direcionado para os custos de Impostos e Frete — mas não se preocupe, você ainda pode solicitar o cancelamento diretamente pelo formulário oficial da Shopee abaixo.",
        highlight: true,
      },
      {
        section: "Shopee webform link",
        english:
          "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
        portuguese:
          "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Rest assured your money is protected by Shopee Guarantee—once your cancellation request through the app or Shopee webform is accepted, your money will be refunded immediately.",
        portuguese:
          "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que a sua solicitação de cancelamento pelo aplicativo ou pelo formulário da Shopee for aceita, o seu dinheiro será reembolsado imediatamente.",
        highlight: true,
      },
      {
        section: "Closing",
        english: "We appreciate your understanding and are here if you need any further help.",
        portuguese: "Agradecemos a sua compreensão e estamos à disposição se precisar de mais alguma ajuda.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Initial Reply (Cancel Button + Webform)",
        cxTrigger: "CX asks to cancel while order is still in preparation",
        rows: [
          {
            section: "Greeting & Policy",
            english:
              "Hello! Thank you for contacting us. Please kindly note that our store is unable to cancel orders directly or issue direct refunds, as all transactions happen inside Shopee.",
            portuguese:
              "Olá! Obrigado por entrar em contato conosco. Por favor, observe que a nossa loja não consegue cancelar pedidos diretamente nem realizar reembolsos diretos, pois todas as transações acontecem dentro da Shopee.",
            highlight: true,
          },
          {
            section: "Tap Cancel Order",
            english:
              'Since your order is still in preparation, please kindly tap the "Cancel Order" button directly in your Shopee app.',
            portuguese:
              'Como o seu pedido ainda está em preparação, por favor, toque gentilmente no botão "Cancelar pedido" diretamente no aplicativo da Shopee.',
            highlight: true,
          },
          {
            section: "If button unavailable",
            english:
              "If the Cancel Order button is no longer available, it is because your payment has already been distributed to Taxes and Shipping costs—no worries, you can still request cancellation directly through Shopee's official webform below.",
            portuguese:
              "Se o botão de cancelamento não estiver mais disponível, é porque o seu pagamento já foi direcionado para os custos de Impostos e Frete — mas não se preocupe, você ainda pode solicitar o cancelamento diretamente pelo formulário oficial da Shopee abaixo.",
            highlight: true,
          },
          {
            section: "Shopee webform link",
            english:
              "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
            portuguese:
              "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is protected by Shopee Guarantee—once your cancellation request through the app or Shopee webform is accepted, your money will be refunded immediately.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que a sua solicitação de cancelamento pelo aplicativo ou pelo formulário da Shopee for aceita, o seu dinheiro será reembolsado imediatamente.",
            highlight: true,
          },
          {
            section: "Closing",
            english: "We appreciate your understanding and are here if you need any further help.",
            portuguese: "Agradecemos a sua compreensão e estamos à disposição se precisar de mais alguma ajuda.",
          },
        ],
      },
      {
        id: "button-missing",
        label: "2. CX Says Cancel Button Unavailable",
        cxTrigger: "CX replies that the Cancel Order button is greyed out or missing",
        rows: [
          {
            section: "Explanation",
            english:
              "Thank you for checking! Because the Cancel Order button is no longer available, it means your payment has already been distributed to Taxes and Shipping costs.",
            portuguese:
              "Obrigado por verificar! Como o botão de cancelamento não está mais disponível, isso significa que o seu pagamento já foi direcionado para os custos de Impostos e Frete.",
            highlight: true,
          },
          {
            section: "Shopee webform",
            english:
              "No worries—you can still request your cancellation directly through Shopee's official webform link below:",
            portuguese:
              "Não se preocupe — você ainda pode solicitar o cancelamento diretamente pelo formulário oficial da Shopee no link abaixo:",
            highlight: true,
          },
          {
            section: "Shopee webform link",
            english:
              "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
            portuguese:
              "https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is protected by Shopee Guarantee—once your cancellation request via the Shopee webform is accepted, your money will be refunded immediately.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que a sua solicitação de cancelamento pelo formulário da Shopee for aceita, o seu dinheiro será reembolsado imediatamente.",
            highlight: true,
          },
          {
            section: "Closing",
            english: "Please let us know if you need any help filling out the form.",
            portuguese: "Por favor, nos avise se precisar de qualquer ajuda para preencher o formulário.",
          },
        ],
      },
    ],
  },
  {
    id: "s14",
    number: 14,
    title: "Expedite Order & Follow-Up Request",
    category: ScenarioCategory.DELAYED,
    whenToUse:
      "CX asks to expedite, rush, or prioritize their order shipping/delivery (or asks the store to speed up delivery).",
    policyRule:
      "Clarify seller doesn't control courier speed/routing once shipped, confirm we follow up and expedite with courier, share status/tracking & 5–14d EDD estimate, plus Shopee Guarantee.",
    guideIds: ["find-order"],
    sampleInput: `Order SN:
26111044EXP8M1
Shipping Tracking No
BR261110448812Q
Shipping Carrier Name
Expresso padrão
Estimated Delivery Time
2026-11-22 00:00 +0800
Latest Logistic Status
Picked_Up
Latest Logistic Date
2026-11-11 14:20 +0800

CX> Please expedite my order, I need it urgently!`,
    rows: [
      {
        section: "Greeting",
        english:
          "Hello! Thank you very much for your message and for your patience. We completely understand that you need your order urgently.",
        portuguese:
          "Olá! Muito obrigado pela sua mensagem e pela sua paciência. Entendemos perfeitamente que você precisa do seu pedido com urgência.",
      },
      {
        section: "Courier speed clarification",
        english:
          "As the seller, we do not have direct control over the courier's delivery speed or routing once the package is shipped. However, we will do our best to help.",
        portuguese:
          "Como vendedor, não temos controle direto sobre a velocidade ou rota de entrega da transportadora assim que o pacote for enviado. No entanto, faremos o possível para ajudar.",
      },
      {
        section: "Expedite & Follow-up",
        english:
          "Please rest assured that we follow up this to courier and we expedite follow your order to courier—we have already submitted a request to prioritize and follow up on your order for the fastest possible movement.",
        portuguese:
          "Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora — já registramos uma solicitação para priorizar e acompanhar o seu pedido para a movimentação mais rápida possível.",
        highlight: true,
      },
      {
        section: "Tracking & Est. Delivery",
        english:
          "Your order (tracking [TRACKING]) shows an estimated delivery date of [DATE], and no worries—this is only an estimate, as international orders usually arrive within 5–14 days.",
        portuguese:
          "O seu pedido (rastreamento [RASTREAMENTO]) apresenta data estimada de entrega para [DATA], e fique tranquilo — isso é apenas uma estimativa, pois normalmente os pedidos internacionais chegam em apenas 5 a 14 dias.",
      },
      {
        section: "Assurance",
        english:
          "Rest assured we have requested a follow-up on your order, your package is safe and on its way, and your payment remains fully protected by Shopee Guarantee.",
        portuguese:
          "Fique tranquilo, pois já solicitamos o acompanhamento do seu pedido, o seu pacote está seguro e a caminho, e o seu pagamento continua totalmente protegido pela Garantia Shopee.",
        highlight: true,
      },
      {
        section: "Closing",
        english:
          "Thank you very much for your patience, and please feel free to message us anytime if you need another update.",
        portuguese:
          "Muito obrigado pela sua paciência e sinta-se à vontade para nos enviar uma mensagem a qualquer momento se precisar de outra atualização.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Shipped / In Transit Urgent Follow-Up",
        cxTrigger: "CX asks to expedite an order already handed to courier",
        rows: [
          {
            section: "Greeting",
            english:
              "Hello! Thank you very much for your message and for your patience. We completely understand that you need your order urgently.",
            portuguese:
              "Olá! Muito obrigado pela sua mensagem e pela sua paciência. Entendemos perfeitamente que você precisa do seu pedido com urgência.",
          },
          {
            section: "Courier speed clarification",
            english:
              "As the seller, we do not have direct control over the courier's delivery speed or routing once the package is shipped. However, we will do our best to help.",
            portuguese:
              "Como vendedor, não temos controle direto sobre a velocidade ou rota de entrega da transportadora assim que o pacote for enviado. No entanto, faremos o possível para ajudar.",
          },
          {
            section: "Expedite & Follow-up",
            english:
              "Please rest assured that we follow up this to courier and we expedite follow your order to courier—we have already submitted a request to prioritize and follow up on your order for the fastest possible movement.",
            portuguese:
              "Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora — já registramos uma solicitação para priorizar e acompanhar o seu pedido para a movimentação mais rápida possível.",
            highlight: true,
          },
          {
            section: "Tracking & Est. Delivery",
            english:
              "Your order (tracking [TRACKING]) shows an estimated delivery date of [DATE], and no worries—this is only an estimate, as international orders usually arrive within 5–14 days.",
            portuguese:
              "O seu pedido (rastreamento [RASTREAMENTO]) apresenta data estimada de entrega para [DATA], e fique tranquilo — isso é apenas uma estimativa, pois normalmente os pedidos internacionais chegam em apenas 5 a 14 dias.",
          },
          {
            section: "Assurance",
            english:
              "Rest assured we have requested a follow-up on your order, your package is safe and on its way, and your payment remains fully protected by Shopee Guarantee.",
            portuguese:
              "Fique tranquilo, pois já solicitamos o acompanhamento do seu pedido, o seu pacote está seguro e a caminho, e o seu pagamento continua totalmente protegido pela Garantia Shopee.",
            highlight: true,
          },
          {
            section: "Closing",
            english:
              "Thank you very much for your patience, and please feel free to message us anytime if you need another update.",
            portuguese:
              "Muito obrigado pela sua paciência e sinta-se à vontade para nos enviar uma mensagem a qualquer momento se precisar de outra atualização.",
          },
        ],
      },
      {
        id: "specific-deadline",
        label: "2. CX Needs Order Before Specific Date",
        cxTrigger: "CX says they have a trip/event and might not be able to wait",
        rows: [
          {
            section: "Follow-up & Transparency",
            english:
              "We have already requested to expedite and follow up on your order with the courier ([TRACKING]), though the final delivery date depends on the carrier's route up to the estimated date ([DATE]).",
            portuguese:
              "Já solicitamos a agilização e o acompanhamento do seu pedido junto à transportadora ([RASTREAMENTO]), porém a data exata de entrega depende da rota da transportadora até a data estimada ([DATA]).",
            highlight: true,
          },
          {
            section: "If it doesn't arrive in time",
            english:
              "If you are away or no longer need the item when it arrives within the estimated date, you may kindly refuse the delivery or submit a request via Shopee's webform (https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=).",
            portuguese:
              "Caso você não possa receber ou não precise mais do item na chegada dentro do prazo estimado, você pode recusar a entrega ou solicitar pelo formulário oficial da Shopee (https://help.shopee.com.br/portal/webform/d75e2dbb49594bd19d1ea83485339a45?entryPoint=1&lastArticleID=).",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your order and payment remain fully protected by Shopee Guarantee.",
            portuguese:
              "Fique tranquilo, pois o seu pedido e pagamento continuam totalmente protegidos pela Garantia Shopee.",
            highlight: true,
          },
        ],
      },
      {
        id: "in-preparation-urgent",
        label: "3. Just Placed / In Preparation Urgent",
        cxTrigger: "Order was just placed or is still being prepared in the warehouse",
        rows: [
          {
            section: "Greeting & Empathy",
            english:
              "Hello! Thank you very much for your message and patience. We completely understand that you need this product urgently.",
            portuguese:
              "Olá! Muito obrigado pela sua mensagem e paciência. Entendemos perfeitamente que você precisa deste produto com urgência.",
          },
          {
            section: "Current status",
            english:
              "Your order was recently placed and is currently being prepared in our warehouse, with an estimated ship-out date of [DATE].",
            portuguese:
              "O seu pedido foi feito recentemente e está atualmente sendo preparado no nosso armazém, com data estimada de envio em [DATA].",
          },
          {
            section: "Clarification & Follow-up",
            english:
              "As the seller, we do not control courier speed once shipped, but rest assured that we follow up this to courier and we expedite follow your order to courier for priority handling.",
            portuguese:
              "Como vendedor, não controlamos a velocidade da transportadora após o envio, mas fique tranquilo pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora para tratamento prioritário.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "No worries—estimated dates are only an estimate (international orders usually arrive within 5–14 days), and your purchase remains protected by Shopee Guarantee.",
            portuguese:
              "Fique tranquilo, pois as datas estimadas são apenas uma estimativa (pedidos internacionais costumam chegar em 5 a 14 dias), e a sua compra continua protegida pela Garantia Shopee.",
            highlight: true,
          },
        ],
      },
    ],
  },
  {
    id: "s15",
    number: 15,
    title: "Poor Quality / Missing Part / Damage",
    category: ScenarioCategory.PRODUCT,
    whenToUse:
      "CX reports poor quality, missing accessory/part, or damage. Stage 1: empathize, ask for video proof, and assure they won't be at a loss. Stage 2 (after proof): if <= R$25 offer 2 options (Keep + Store Voucher >= amount OR Return & Refund); if > R$25 escalate (24–48h chat update).",
    policyRule:
      "Ask proof first + assure no loss. After proof: if <= R$25 (don't mention limit), offer Option 1 (Keep item + R$5/10/15/20/25 Store Voucher >= item amount) or Option 2 (Return & Refund). If > R$25, escalate to higher team (24–48h).",
    guideIds: ["voucher-wallet", "voucher-steps", "return-refund", "counter-offer", "refund-sla"],
    sampleInput: `Order SN:
2611039SP7DNMP
Brincos de Luxo com Correntes Longas e Anéis Texturizados Dourados, brincos para mulheres com design Boho Chic
Variation: 1 par-Ouro
R$11,77 x1
Grand Total: R$14,18
Shipping Tracking No
BR267585378448Q
Shipping Carrier Name
Expresso padrão
Shipping Logistics Status
DELIVERY_DONE
Latest Logistic Status
DELIVERED
Latest Logistic Date
2026-11-13 02:54 +0800

CX> Very poor quality, not even clutch came. It is beautiful, but they have not even had this care`,
    rows: [
      {
        section: "Empathy",
        english:
          "Hello! We are glad you liked the design, and we sincerely apologize that the quality did not meet your expectations and that the clutch/part was missing or damaged.",
        portuguese:
          "Olá! Ficamos felizes que tenha gostado do visual da peça, mas pedimos sinceras desculpas por a qualidade não ter atendido às suas expectativas e por o item ter chegado sem a tarraxa ou com avaria.",
        highlight: true,
      },
      {
        section: "Ask for proof",
        english:
          "To help us review this properly with our quality team, could you please send us a short video (or clear photo) showing the product and the issue?",
        portuguese:
          "Para que possamos analisar o ocorrido com a nossa equipe de qualidade, você poderia nos enviar um vídeo curto (ou foto nítida) mostrando o produto e o problema?",
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Please rest assured that we will make sure you won't be at a loss on this, and your purchase remains fully protected by Shopee Guarantee.",
        portuguese:
          "Fique tranquilo, pois garantiremos que você não saia no prejuízo com isso e a sua compra continua totalmente protegida pela Garantia Shopee.",
        highlight: true,
      },
      {
        section: "Closing",
        english:
          "Once you send the video or photo, we will check it right away and offer you the best solution.",
        portuguese:
          "Assim que você enviar o vídeo ou a foto, verificaremos imediatamente e ofereceremos a melhor solução para você.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Initial Complaint (Ask Proof)",
        cxTrigger: "CX complains about poor quality, missing clutch/part, or damage",
        rows: [
          {
            section: "Empathy",
            english:
              "Hello! We are glad you liked the design, and we sincerely apologize that the quality did not meet your expectations and that the clutch/part was missing or damaged.",
            portuguese:
              "Olá! Ficamos felizes que tenha gostado do visual da peça, mas pedimos sinceras desculpas por a qualidade não ter atendido às suas expectativas e por o item ter chegado sem a tarraxa ou com avaria.",
            highlight: true,
          },
          {
            section: "Ask for proof",
            english:
              "To help us review this properly with our quality team, could you please send us a short video (or clear photo) showing the product and the issue?",
            portuguese:
              "Para que possamos analisar o ocorrido com a nossa equipe de qualidade, você poderia nos enviar um vídeo curto (ou foto nítida) mostrando o produto e o problema?",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Please rest assured that we will make sure you won't be at a loss on this, and your purchase remains fully protected by Shopee Guarantee.",
            portuguese:
              "Fique tranquilo, pois garantiremos que você não saia no prejuízo com isso e a sua compra continua totalmente protegida pela Garantia Shopee.",
            highlight: true,
          },
          {
            section: "Closing",
            english:
              "Once you send the video or photo, we will check it right away and offer you the best solution.",
            portuguese:
              "Assim que você enviar o vídeo ou a foto, verificaremos imediatamente e ofereceremos a melhor solução para você.",
          },
        ],
      },
      {
        id: "proof-under-25",
        label: "2A. CX Sent Proof (<= R$25: 2 Options)",
        cxTrigger: "CX sent video/photo proof and product amount is <= R$25",
        rows: [
          {
            section: "Thank for proof",
            english:
              "Thank you very much for sending the proof and for your patience while we reviewed your order.",
            portuguese:
              "Muito obrigado por enviar a comprovação e pela sua paciência enquanto verificávamos o seu pedido.",
          },
          {
            section: "Two options intro",
            english:
              "To make sure you are completely satisfied, we would like to offer you two options to choose from:",
            portuguese:
              "Para garantir que você fique totalmente satisfeito(a), gostaríamos de oferecer duas opções para você escolher:",
          },
          {
            section: "Option 1 — Voucher",
            english:
              "1. Keep the item + [VOUCHER] Store Voucher: You keep the current item, and we will send you a store voucher. This is the fastest way to get a replacement without the hassle of returning anything.",
            portuguese:
              "1. Ficar com o item + Cupom da Loja de [VOUCHER]: Você fica com o item atual e nós enviaremos um cupom da nossa loja. Essa é a forma mais rápida de conseguir uma reposição sem o transtorno de precisar devolver nada.",
            highlight: true,
          },
          {
            section: "Option 2 — Return & Refund",
            english:
              "2. Return & Refund: You may send the item back to us, and we will issue a full refund once it is received.",
            portuguese:
              "2. Devolução e Reembolso: Você pode nos devolver o item, e emitiremos um reembolso integral assim que ele for recebido.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured we will make sure you won't be at a loss on this, and your purchase remains protected by Shopee Guarantee.",
            portuguese:
              "Fique tranquilo, pois garantiremos que você não saia no prejuízo com isso e a sua compra continua protegida pela Garantia Shopee.",
          },
          {
            section: "Closing",
            english:
              "Please let us know which option you prefer (1 or 2) so we can proceed right away for you.",
            portuguese:
              "Por favor, nos avise qual opção você prefere (1 ou 2) para que possamos prosseguir imediatamente para você.",
          },
        ],
      },
      {
        id: "proof-over-25",
        label: "2B. CX Sent Proof (> R$25: Escalate)",
        cxTrigger: "CX sent video/photo proof and product amount is > R$25",
        rows: [
          {
            section: "Thank for proof",
            english:
              "Thank you very much for sending the proof and for your patience while we reviewed your order.",
            portuguese:
              "Muito obrigado por enviar a comprovação e pela sua paciência enquanto verificávamos o seu pedido.",
          },
          {
            section: "Escalate to higher team",
            english:
              "We will escalate this case to our higher team to provide you with the best solution—you will receive an update directly here on our chat within 24–48 hours.",
            portuguese:
              "Vamos encaminhar este caso para a nossa equipe superior para oferecer a melhor solução para você — você receberá uma atualização diretamente aqui no nosso chat dentro de 24 a 48 horas.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured that we will make sure you won't be at a loss on this, and your purchase remains protected by Shopee Guarantee.",
            portuguese:
              "Fique tranquilo, pois garantiremos que você não saia no prejuízo com isso e a sua compra continua protegida pela Garantia Shopee.",
            highlight: true,
          },
          {
            section: "Closing",
            english:
              "Thank you for your understanding, and we will get back to you here shortly.",
            portuguese:
              "Agradecemos a sua compreensão e retornaremos aqui em breve com uma atualização.",
          },
        ],
      },
      {
        id: "accepted-voucher",
        label: "3A. CX Accepted Option 1 (Voucher)",
        cxTrigger: "CX accepts Option 1 (keep the item + Store Voucher)",
        rows: [
          {
            section: "Confirm choice",
            english:
              "Thank you for confirming! We are glad you chose Option 1 so you can resolve this quickly without the hassle of returning the item.",
            portuguese:
              "Obrigado por confirmar! Ficamos felizes que tenha escolhido a Opção 1 para resolver isso rapidamente sem o transtorno de precisar devolver o item.",
          },
          {
            section: "Send store voucher",
            english:
              "You may keep the current item, and we are sending your [VOUCHER] store voucher right here now so you can apply it on your next order in our shop.",
            portuguese:
              "Você pode ficar com o item atual e já estamos enviando o seu cupom da loja de [VOUCHER] por aqui agora mesmo para que possa utilizá-lo no seu próximo pedido na nossa loja.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Please rest assured we truly value your satisfaction and want to make sure you are completely happy with our solution.",
            portuguese:
              "Fique tranquilo, pois valorizamos muito a sua satisfação e queremos garantir que você fique totalmente satisfeito(a) com a nossa solução.",
            highlight: true,
          },
          {
            section: "Closing",
            english:
              "Thank you very much for your patience and understanding—please let us know if you need any help applying the voucher.",
            portuguese:
              "Muito obrigado pela sua paciência e compreensão — por favor, nos avise se precisar de qualquer ajuda para aplicar o cupom.",
          },
        ],
      },
      {
        id: "accepted-return",
        label: "3B. CX Chose Option 2 (Return & Refund)",
        cxTrigger: "CX chooses Option 2 (send item back for Return & Refund)",
        rows: [
          {
            section: "Confirm choice",
            english:
              "Thank you for confirming! We understand you prefer Option 2 (Return & Refund).",
            portuguese:
              "Obrigado por confirmar! Entendemos que você prefere a Opção 2 (Devolução e Reembolso).",
          },
          {
            section: "Return/Refund steps",
            english:
              'Please go to your order details in the Shopee app and tap the "Return/Refund" button to submit the return request, follow the return shipping instructions, and send the item back to us.',
            portuguese:
              'Por favor, acesse os detalhes do pedido no aplicativo da Shopee e toque no botão "Devolução/Reembolso" para enviar a solicitação de devolução, seguir as instruções de envio e nos devolver o item.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is protected by Shopee Guarantee—once the returned item is received and processed, a full refund will be issued immediately through Shopee.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está protegido pela Garantia Shopee — assim que o item devolvido for recebido e processado, o reembolso integral será emitido imediatamente pela Shopee.",
            highlight: true,
          },
          {
            section: "Closing",
            english:
              "Thank you for your cooperation, and please let us know if you need any assistance in the Shopee app.",
            portuguese:
              "Agradecemos a sua colaboração e nos avise se precisar de qualquer ajuda no aplicativo da Shopee.",
          },
        ],
      },
    ],
  },
  {
    id: "s16",
    number: 16,
    title: "Paid Order Shows as Unpaid",
    category: ScenarioCategory.PLATFORM,
    whenToUse:
      "CX says they already paid for their order, but Shopee Seller Center / app still shows status as Unpaid.",
    policyRule:
      "Inform we do not have access to payments; reassure it usually reflects in less than 24 hours; if >24 hours, instruct CX to contact Shopee platform support to follow up, plus Shopee Guarantee assurance.",
    guideIds: ["contact-shopee-cs", "find-order"],
    sampleInput: `Unpaid
2026-11-13 06:55 +0800
Order SN:
2611136G0D63KM
Grand Total
R$16,72
Óculos Anti-Luz Azul Para Homens E Mulheres , Armação De Caixa , Ópticos Clássicos Sem Prescrição
Variation: Transparente
R$15,14 x1

CX: I paid for my order but it shows as if I had not paid`,
    rows: [
      {
        section: "Greeting",
        english:
          "Hello! Thank you for contacting us, and we understand your concern regarding your payment status.",
        portuguese:
          "Olá! Obrigado por entrar em contato conosco e entendemos a sua preocupação em relação ao status do seu pagamento.",
      },
      {
        section: "No access to payments",
        english:
          "Please kindly note that our store does not have access to payment processing or payment details, as all payments are handled directly by Shopee.",
        portuguese:
          "Por favor, observe que a nossa loja não tem acesso ao processamento ou aos detalhes de pagamento, pois todos os pagamentos são tratados diretamente pela Shopee.",
        highlight: true,
      },
      {
        section: "Reflection (< 24h)",
        english:
          "No worries! Your payment confirmation will reflect soon—it usually takes less than 24 hours for Shopee's system to update the order status.",
        portuguese:
          "Não se preocupe! A confirmação do seu pagamento aparecerá em breve — normalmente leva menos de 24 horas para o sistema da Shopee atualizar o status do pedido.",
        highlight: true,
      },
      {
        section: "If > 24 hours",
        english:
          'If it has already been more than 24 hours since you made the payment, please contact the Shopee platform directly ("Me" -> "Help Center" / "Customer Service") with your payment receipt so they can follow up on your payment.',
        portuguese:
          'Se já tiverem se passado mais de 24 horas desde o pagamento, por favor entre em contato diretamente com a plataforma da Shopee ("Eu" -> "Central de Ajuda" / "Atendimento") enviando o seu comprovante para que eles acompanhem o seu pagamento.',
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Rest assured your money is safe and protected by Shopee Guarantee—as soon as Shopee confirms the payment in the system, we will prepare and ship your order right away.",
        portuguese:
          "Fique tranquilo, pois o seu dinheiro está seguro e protegido pela Garantia Shopee — assim que a Shopee confirmar o pagamento no sistema, prepararemos e enviaremos o seu pedido imediatamente.",
        highlight: true,
      },
      {
        section: "Closing",
        english:
          "Thank you very much for your patience, and please let us know if you need any further help.",
        portuguese:
          "Muito obrigado pela sua paciência e nos avise se precisar de qualquer outra ajuda.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Initial Reply (<24h Reflection + >24h Guide)",
        cxTrigger: "CX says they paid for their order, but the app/system still shows Unpaid",
        rows: [
          {
            section: "Greeting",
            english:
              "Hello! Thank you for contacting us, and we understand your concern regarding your payment status.",
            portuguese:
              "Olá! Obrigado por entrar em contato conosco e entendemos a sua preocupação em relação ao status do seu pagamento.",
          },
          {
            section: "No access to payments",
            english:
              "Please kindly note that our store does not have access to payment processing or payment details, as all payments are handled directly by Shopee.",
            portuguese:
              "Por favor, observe que a nossa loja não tem acesso ao processamento ou aos detalhes de pagamento, pois todos os pagamentos são tratados diretamente pela Shopee.",
            highlight: true,
          },
          {
            section: "Reflection (< 24h)",
            english:
              "No worries! Your payment confirmation will reflect soon—it usually takes less than 24 hours for Shopee's system to update the order status.",
            portuguese:
              "Não se preocupe! A confirmação do seu pagamento aparecerá em breve — normalmente leva menos de 24 horas para o sistema da Shopee atualizar o status do pedido.",
            highlight: true,
          },
          {
            section: "If > 24 hours",
            english:
              'If it has already been more than 24 hours since you made the payment, please contact the Shopee platform directly ("Me" -> "Help Center" / "Customer Service") with your payment receipt so they can follow up on your payment.',
            portuguese:
              'Se já tiverem se passado mais de 24 horas desde o pagamento, por favor entre em contato diretamente com a plataforma da Shopee ("Eu" -> "Central de Ajuda" / "Atendimento") enviando o seu comprovante para que eles acompanhem o seu pagamento.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is safe and protected by Shopee Guarantee—as soon as Shopee confirms the payment in the system, we will prepare and ship your order right away.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está seguro e protegido pela Garantia Shopee — assim que a Shopee confirmar o pagamento no sistema, prepararemos e enviaremos o seu pedido imediatamente.",
            highlight: true,
          },
          {
            section: "Closing",
            english:
              "Thank you very much for your patience, and please let us know if you need any further help.",
            portuguese:
              "Muito obrigado pela sua paciência e nos avise se precisar de qualquer outra ajuda.",
          },
        ],
      },
      {
        id: "over-24h",
        label: "2. CX Says Paid >24 Hours Ago",
        cxTrigger: "CX confirms they paid more than 24 hours ago and it still shows Unpaid",
        rows: [
          {
            section: "Acknowledgment",
            english:
              "Thank you for letting us know that it has already been more than 24 hours since you completed the payment.",
            portuguese:
              "Obrigado por nos informar que já se passaram mais de 24 horas desde que você realizou o pagamento.",
          },
          {
            section: "No access to payments",
            english:
              "Because our store does not have access to Shopee's payment system, we are unable to check or manually confirm the transaction from our side.",
            portuguese:
              "Como a nossa loja não tem acesso ao sistema de pagamentos da Shopee, não conseguimos verificar ou confirmar manualmente a transação pelo nosso lado.",
            highlight: true,
          },
          {
            section: "Contact Shopee Platform",
            english:
              'Please contact the Shopee platform directly via "Me" -> "Help Center" / "Customer Service" in the Shopee app with your payment proof/receipt so their team can follow up on and verify your payment right away.',
            portuguese:
              'Por favor, entre em contato diretamente com a plataforma da Shopee acessando "Eu" -> "Central de Ajuda" / "Atendimento" no aplicativo da Shopee com o seu comprovante de pagamento, para que a equipe deles acompanhe e confirme o seu pagamento imediatamente.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is completely safe and protected by Shopee Guarantee—once Shopee updates the order status to Paid, we will ship your order as soon as possible.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está totalmente seguro e protegido pela Garantia Shopee — assim que a Shopee atualizar o status do pedido para Pago, enviaremos o seu pedido o mais rápido possível.",
            highlight: true,
          },
          {
            section: "Closing",
            english:
              "We appreciate your understanding and remain here if you need any further assistance.",
            portuguese:
              "Agradecemos a sua compreensão e permanecemos à disposição se precisar de mais alguma ajuda.",
          },
        ],
      },
    ],
  },
  {
    id: "s17",
    number: 17,
    title: "Arrived in Brazil — No Updates Since",
    category: ScenarioCategory.DELAYED,
    whenToUse:
      'Tracking shows "Pedido chegou no Brasil" and then goes silent for many days.',
    policyRule:
      "Explain that domestic sorting/inspection can have a silent gap, include both follow-up phrases, share 5–14d EDD estimate, and reassure under Shopee Guarantee.",
    guideIds: ["find-order"],
    sampleInput:
      "Order #261102BR88N2 (Tracking BR2688123400Q, Expresso padrão) > Tracking says 'Pedido chegou no Brasil' 8 days ago with no updates since.",
    rows: [
      {
        section: "Greeting & Empathy",
        english:
          "Hello! Thank you for contacting us. We understand your concern about the lack of tracking updates and apologize for the wait.",
        portuguese:
          "Olá! Obrigado por entrar em contato conosco. Entendemos a sua preocupação sobre a falta de atualizações de rastreamento e pedimos desculpas pela espera.",
      },
      {
        section: "Current status",
        english:
          "We checked your tracking and can confirm that your order arrived in Brazil on [DATE]. It is currently being processed through the local logistics network before moving to the next stage.",
        portuguese:
          "Verificamos o rastreamento e podemos confirmar que o seu pedido chegou ao Brasil em [DATA]. Ele está atualmente sendo processado pela rede de logística local antes de seguir para a próxima etapa.",
      },
      {
        section: "Domestic sorting explanation",
        english:
          "It is completely normal for shipments to have a gap in updates after arriving in the destination country while the package is sorted, inspected, or transferred between local distribution centers.",
        portuguese:
          "É completamente normal que envios tenham uma lacuna de atualizações após chegar ao país de destino enquanto o pacote é triado, inspecionado ou transferido entre centros de distribuição locais.",
      },
      {
        section: "Follow-up action",
        english:
          "Please rest assured that we follow up this to courier and we expedite follow your order to courier to ensure it continues moving smoothly toward delivery.",
        portuguese:
          "Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora para garantir que ele continue seguindo normalmente em direção à entrega.",
        highlight: true,
      },
      {
        section: "Assurance & Est. Delivery",
        english:
          "No worries—the estimated delivery date ([DATE]) is only an estimate, as international orders usually arrive within 5–14 days. Rest assured your package is safe and protected by Shopee Guarantee.",
        portuguese:
          "Fique tranquilo, pois a data estimada de entrega ([DATA]) é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias. O seu pacote está seguro e protegido pela Garantia Shopee.",
        highlight: true,
      },
      {
        section: "Closing",
        english:
          "If tracking does not update within the next few days, please feel free to contact us again.",
        portuguese:
          "Se o rastreamento não atualizar nos próximos dias, sinta-se à vontade para entrar em contato conosco novamente.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Domestic Sorting Gap & Courier Follow-Up",
        cxTrigger: "Tracking arrived in Brazil and went silent",
        rows: [
          {
            section: "Greeting & Empathy",
            english:
              "Hello! Thank you for contacting us. We understand your concern about the lack of tracking updates and apologize for the wait.",
            portuguese:
              "Olá! Obrigado por entrar em contato conosco. Entendemos a sua preocupação sobre a falta de atualizações de rastreamento e pedimos desculpas pela espera.",
          },
          {
            section: "Current status",
            english:
              "We checked your tracking and can confirm that your order arrived in Brazil on [DATE]. It is currently being processed through the local logistics network before moving to the next stage.",
            portuguese:
              "Verificamos o rastreamento e podemos confirmar que o seu pedido chegou ao Brasil em [DATA]. Ele está atualmente sendo processado pela rede de logística local antes de seguir para a próxima etapa.",
          },
          {
            section: "Domestic sorting explanation",
            english:
              "It is completely normal for shipments to have a gap in updates after arriving in the destination country while the package is sorted, inspected, or transferred between local distribution centers.",
            portuguese:
              "É completamente normal que envios tenham uma lacuna de atualizações após chegar ao país de destino enquanto o pacote é triado, inspecionado ou transferido entre centros de distribuição locais.",
          },
          {
            section: "Follow-up action",
            english:
              "Please rest assured that we follow up this to courier and we expedite follow your order to courier to ensure it continues moving smoothly toward delivery.",
            portuguese:
              "Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora para garantir que ele continue seguindo normalmente em direção à entrega.",
            highlight: true,
          },
          {
            section: "Assurance & Est. Delivery",
            english:
              "No worries—the estimated delivery date ([DATE]) is only an estimate, as international orders usually arrive within 5–14 days. Rest assured your package is safe and protected by Shopee Guarantee.",
            portuguese:
              "Fique tranquilo, pois a data estimada de entrega ([DATA]) é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias. O seu pacote está seguro e protegido pela Garantia Shopee.",
            highlight: true,
          },
        ],
      },
    ],
  },
  {
    id: "s18",
    number: 18,
    title: "Canceled Discrepancy (Shows Paid & Shipped)",
    category: ScenarioCategory.PLATFORM,
    whenToUse:
      "Customer claims the order was canceled without a refund, but the system still shows the order as paid and shipped.",
    policyRule:
      "State clearly what the system actually shows (paid, shipped, latest scan, EDD). Clarify cancellation/refund status is platform scope and redirect to Shopee Help Center.",
    guideIds: ["contact-shopee-cs", "find-order", "refund-sla"],
    sampleInput:
      "Order #261104BR31P9 (Shipped Nov 5, Latest update Nov 10, Est Delivery Nov 24) > CX says: 'My order was canceled and I still got no refund!'",
    rows: [
      {
        section: "Greeting & Empathy",
        english:
          "Hello! Thank you for reaching out to us, and we understand your concern regarding your order status and refund.",
        portuguese:
          "Olá! Obrigado por entrar em contato conosco e entendemos a sua preocupação em relação ao status do pedido e ao reembolso.",
      },
      {
        section: "Order status",
        english:
          "We checked your order and our records show it was paid and already shipped on [DATE], currently in transit (latest update [DATE], estimated delivery [DATE]).",
        portuguese:
          "Verificamos o seu pedido e os nossos registros mostram que ele foi pago e já enviado em [DATA], estando em trânsito (última atualização em [DATA], entrega estimada em [DATA]).",
        highlight: true,
      },
      {
        section: "Discrepancy & Platform scope",
        english:
          "Since our system does not show this order as canceled, matters related to cancellation records, refund status, and payments are handled directly by Shopee and are outside our store's scope.",
        portuguese:
          "Como o nosso sistema não mostra este pedido como cancelado, assuntos relacionados a registros de cancelamento, status de reembolso e pagamentos são tratados diretamente pela Shopee e estão fora do alcance da loja.",
        highlight: true,
      },
      {
        section: "Redirect to Shopee",
        english:
          'Please contact Shopee\'s official support directly via "Me" -> "Help Center" / "Customer Service" in the app so they can verify your account\'s cancellation/refund records.',
        portuguese:
          'Por favor, entre em contato diretamente com o atendimento oficial da Shopee acessando "Eu" -> "Central de Ajuda" / "Atendimento" no aplicativo para que verifiquem os registros na sua conta.',
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Rest assured your payment remains fully protected by Shopee Guarantee while Shopee verifies your order status.",
        portuguese:
          "Fique tranquilo, pois o seu pagamento continua totalmente protegido pela Garantia Shopee enquanto a Shopee verifica o status do pedido.",
      },
      {
        section: "Closing",
        english: "We appreciate your understanding and remain available if you need anything else.",
        portuguese: "Agradecemos a sua compreensão e permanecemos à disposição se precisar de mais alguma coisa.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Clarify System Status & Redirect to Shopee",
        cxTrigger: "CX claims canceled without refund, yet system shows paid & shipped",
        rows: [
          {
            section: "Greeting & Empathy",
            english:
              "Hello! Thank you for reaching out to us, and we understand your concern regarding your order status and refund.",
            portuguese:
              "Olá! Obrigado por entrar em contato conosco e entendemos a sua preocupação em relação ao status do pedido e ao reembolso.",
          },
          {
            section: "Order status",
            english:
              "We checked your order and our records show it was paid and already shipped on [DATE], currently in transit (latest update [DATE], estimated delivery [DATE]).",
            portuguese:
              "Verificamos o seu pedido e os nossos registros mostram que ele foi pago e já enviado em [DATA], estando em trânsito (última atualização em [DATA], entrega estimada em [DATA]).",
            highlight: true,
          },
          {
            section: "Redirect to Shopee",
            english:
              'Because our system does not show it as canceled and refund/payment records belong to Shopee, please contact Shopee Support ("Me" -> "Help Center" / "Customer Service") so they can check directly.',
            portuguese:
              'Como o nosso sistema não mostra o pedido como cancelado e os registros financeiros pertencem à Shopee, entre em contato com o suporte da Shopee ("Eu" -> "Central de Ajuda" / "Atendimento").',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your payment remains fully protected by Shopee Guarantee while Shopee verifies your order status.",
            portuguese:
              "Fique tranquilo, pois o seu pagamento continua totalmente protegido pela Garantia Shopee enquanto a Shopee verifica o status do pedido.",
          },
        ],
      },
    ],
  },
  {
    id: "s19",
    number: 19,
    title: "Invalid / Unpaid Order — Refund Question",
    category: ScenarioCategory.PLATFORM,
    whenToUse:
      'Order status shows "INVALID" with no payment date, and the customer asks how to get a refund.',
    policyRule:
      "Explain that no payment was captured/received by the store for an Invalid order, and redirect to Shopee Help Center for any payment/refund check.",
    guideIds: ["contact-shopee-cs", "find-order"],
    sampleInput:
      "Order #261108BR22V1 | Status: INVALID (No Payment Date) > CX asks how to receive their refund.",
    rows: [
      {
        section: "Greeting & Empathy",
        english:
          "Hello! Thank you for reaching out to us, and we understand your concern regarding your refund.",
        portuguese:
          "Olá! Obrigado por entrar em contato conosco e entendemos a sua preocupação em relação ao seu reembolso.",
      },
      {
        section: "Order status",
        english:
          'We checked your order and can see that it is showing as "Invalid" with no payment date recorded, meaning payment was not completed or processed for this order.',
        portuguese:
          'Verificamos o seu pedido e podemos ver que ele aparece como "Inválido", sem data de pagamento registrada, indicando que o pagamento não foi concluído ou processado.',
        highlight: true,
      },
      {
        section: "Refund explanation",
        english:
          "Since the order was not successfully paid, our store did not receive any payment for it and cannot process a refund from our side.",
        portuguese:
          "Como o pedido não foi pago com sucesso, a nossa loja não recebeu nenhum valor por ele e não consegue processar um reembolso do nosso lado.",
        highlight: true,
      },
      {
        section: "Redirect to Shopee",
        english:
          'Because payment processing is handled by Shopee, please contact Shopee Support directly via "Me" -> "Help Center" / "Customer Service" in the app to check any charge.',
        portuguese:
          'Como o processamento de pagamentos é tratado pela Shopee, entre em contato diretamente com o atendimento da Shopee em "Eu" -> "Central de Ajuda" / "Atendimento" para verificar qualquer cobrança.',
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Rest assured your account and any completed charges remain protected by Shopee Guarantee, and Shopee's team can verify the payment details safely.",
        portuguese:
          "Fique tranquilo, pois a sua conta e qualquer cobrança concluída continuam protegidas pela Garantia Shopee, e a equipe da Shopee poderá verificar os detalhes com segurança.",
      },
      {
        section: "Closing",
        english: "We apologize for any inconvenience and appreciate your understanding.",
        portuguese: "Pedimos desculpas por qualquer inconveniente e agradecemos a sua compreensão.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Explain Invalid Status & Redirect to Shopee",
        cxTrigger: "Order is INVALID with no payment date and CX asks for a refund",
        rows: [
          {
            section: "Greeting & Empathy",
            english:
              "Hello! Thank you for reaching out to us, and we understand your concern regarding your refund.",
            portuguese:
              "Olá! Obrigado por entrar em contato conosco e entendemos a sua preocupação em relação ao seu reembolso.",
          },
          {
            section: "Order status & Explanation",
            english:
              'Your order shows as "Invalid" with no payment date recorded, so our store did not receive any payment and cannot issue a refund from our side.',
            portuguese:
              'O seu pedido consta como "Inválido" sem data de pagamento registrada, portanto a nossa loja não recebeu nenhum valor e não consegue emitir reembolso.',
            highlight: true,
          },
          {
            section: "Redirect to Shopee",
            english:
              'Please contact Shopee Support via "Me" -> "Help Center" / "Customer Service" with your receipt so they can verify any transaction safely.',
            portuguese:
              'Por favor, entre em contato com o suporte da Shopee em "Eu" -> "Central de Ajuda" / "Atendimento" com o seu comprovante para que verifiquem a transação com segurança.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your account and any completed charges remain protected by Shopee Guarantee.",
            portuguese:
              "Fique tranquilo, pois a sua conta e qualquer cobrança concluída continuam protegidas pela Garantia Shopee.",
          },
        ],
      },
    ],
  },
  {
    id: "s20",
    number: 20,
    title: '"Will It Be Delivered?" — Delivery Confirmation',
    category: ScenarioCategory.GENERAL,
    whenToUse:
      "Customer simply asks for confirmation that their order is on the way and will be delivered.",
    policyRule:
      "Confirm clearly with ship-out date, latest update, tracking number, 5–14d EDD estimate, and Shopee Guarantee reassurance.",
    guideIds: ["find-order"],
    sampleInput:
      "Order #261111BR45D2 (Tracking AJ26111145001, Estimated Delivery 24/11/2026) > CX asks: 'Will my order still be delivered?'",
    rows: [
      {
        section: "Greeting & Confirmation",
        english:
          "Hello! Thank you for reaching out regarding your order. We can confirm that your order is on its way and will be delivered.",
        portuguese:
          "Olá! Obrigado por entrar em contato sobre o seu pedido. Podemos confirmar que o seu pedido está a caminho e será entregue.",
        highlight: true,
      },
      {
        section: "Current status",
        english:
          "Your order was shipped on [DATE] and is currently in transit, with the latest tracking update on [DATE].",
        portuguese:
          "O seu pedido foi enviado em [DATA] e está atualmente em trânsito, com a última atualização de rastreamento em [DATA].",
      },
      {
        section: "Assurance & Est. Delivery",
        english:
          "No worries—the estimated delivery date ([DATE]) is only an estimate, as international orders usually arrive within 5–14 days. Rest assured your package is safe and protected by Shopee Guarantee.",
        portuguese:
          "Fique tranquilo, pois a data estimada de entrega ([DATA]) é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias. O seu pacote está seguro e protegido pela Garantia Shopee.",
        highlight: true,
      },
      {
        section: "Tracking",
        english:
          "You can continue tracking your order using tracking number [TRACKING] to stay updated on its progress.",
        portuguese:
          "Você pode continuar acompanhando o seu pedido usando o número de rastreamento [RASTREAMENTO] para acompanhar o progresso.",
      },
      {
        section: "Closing",
        english: "We appreciate your patience and hope you receive your order very soon.",
        portuguese: "Agradecemos a sua paciência e esperamos que receba o seu pedido muito em breve.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Confirm Delivery Status & EDD",
        cxTrigger: "CX simply wants confirmation the parcel is coming",
        rows: [
          {
            section: "Greeting & Confirmation",
            english:
              "Hello! Thank you for reaching out regarding your order. We can confirm that your order is on its way and will be delivered.",
            portuguese:
              "Olá! Obrigado por entrar em contato sobre o seu pedido. Podemos confirmar que o seu pedido está a caminho e será entregue.",
            highlight: true,
          },
          {
            section: "Current status",
            english:
              "Your order was shipped on [DATE] and is currently in transit, with the latest tracking update on [DATE].",
            portuguese:
              "O seu pedido foi enviado em [DATA] e está atualmente em trânsito, com a última atualização de rastreamento em [DATA].",
          },
          {
            section: "Assurance & Est. Delivery",
            english:
              "No worries—the estimated delivery date ([DATE]) is only an estimate, as international orders usually arrive within 5–14 days. Rest assured your package is safe and protected by Shopee Guarantee.",
            portuguese:
              "Fique tranquilo, pois a data estimada de entrega ([DATA]) é apenas uma estimativa — normalmente os pedidos internacionais chegam em apenas 5 a 14 dias. O seu pacote está seguro e protegido pela Garantia Shopee.",
            highlight: true,
          },
          {
            section: "Tracking",
            english:
              "You can continue tracking your order using tracking number [TRACKING] to stay updated on its progress.",
            portuguese:
              "Você pode continuar acompanhando o seu pedido usando o número de rastreamento [RASTREAMENTO] para acompanhar o progresso.",
          },
        ],
      },
    ],
  },
  {
    id: "s21",
    number: 21,
    title: "Order Just Paid — Early Stage Reassurance",
    category: ScenarioCategory.GENERAL,
    whenToUse:
      'Customer sends a short positive or eager message like "I hope it arrives soon" right after paying.',
    policyRule:
      "Match the warm positive tone! Quote current status, tracking, and 5–14d EDD estimate with Shopee Guarantee reassurance—no delay or escalation boilerplate.",
    guideIds: ["find-order"],
    sampleInput:
      "Order #261113BR50E1 (Tracking BR2699100022Q, Estimated Delivery 25/11/2026) > CX says: 'I just paid! Hope it arrives soon 😊'",
    rows: [
      {
        section: "Greeting",
        english: "Hello! Thank you so much for your message and for shopping with us.",
        portuguese: "Olá! Muito obrigado pela sua mensagem e por comprar conosco.",
      },
      {
        section: "Warm reassurance",
        english:
          "We hope so too! Your order is moving smoothly through our logistics network.",
        portuguese:
          "Nós também esperamos! O seu pedido está seguindo normalmente pela nossa rede de logística.",
        highlight: true,
      },
      {
        section: "Status & Est. Delivery",
        english:
          "According to our system, the latest update was on [DATE] and the estimated delivery date is [DATE]—no worries, this is only an estimate since international orders usually arrive within 5–14 days.",
        portuguese:
          "De acordo com o nosso sistema, a última atualização foi em [DATA] e a data estimada de entrega é [DATA] — fique tranquilo, essa é apenas uma estimativa, pois pedidos internacionais costumam chegar em apenas 5 a 14 dias.",
      },
      {
        section: "Tracking",
        english: "You can follow every step using tracking number [TRACKING].",
        portuguese: "Você pode acompanhar cada etapa usando o número de rastreamento [RASTREAMENTO].",
      },
      {
        section: "Assurance",
        english:
          "Rest assured your purchase is completely protected by Shopee Guarantee, and we hope your order arrives safely and very soon!",
        portuguese:
          "Fique tranquilo, pois a sua compra está totalmente protegida pela Garantia Shopee, e esperamos que o seu pedido chegue com segurança e bem rápido!",
        highlight: true,
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Warm Early Reassurance",
        cxTrigger: "CX sends an eager or positive message after payment",
        rows: [
          {
            section: "Greeting",
            english: "Hello! Thank you so much for your message and for shopping with us.",
            portuguese: "Olá! Muito obrigado pela sua mensagem e por comprar conosco.",
          },
          {
            section: "Warm reassurance",
            english:
              "We hope so too! Your order is moving smoothly through our logistics network.",
            portuguese:
              "Nós também esperamos! O seu pedido está seguindo normalmente pela nossa rede de logística.",
            highlight: true,
          },
          {
            section: "Status & Est. Delivery",
            english:
              "According to our system, the latest update was on [DATE] and the estimated delivery date is [DATE]—no worries, this is only an estimate since international orders usually arrive within 5–14 days.",
            portuguese:
              "De acordo com o nosso sistema, a última atualização foi em [DATA] e a data estimada de entrega é [DATA] — fique tranquilo, essa é apenas uma estimativa, pois pedidos internacionais costumam chegar em apenas 5 a 14 dias.",
          },
          {
            section: "Assurance",
            english:
              "Rest assured your purchase is completely protected by Shopee Guarantee, and we hope your order arrives safely and very soon!",
            portuguese:
              "Fique tranquilo, pois a sua compra está totalmente protegida pela Garantia Shopee, e esperamos que o seu pedido chegue com segurança e bem rápido!",
            highlight: true,
          },
        ],
      },
    ],
  },
  {
    id: "s22",
    number: 22,
    title: "Past EDD, but Tracking Updated Today",
    category: ScenarioCategory.DELAYED,
    whenToUse:
      "The estimated delivery date has already passed, yet tracking shows a fresh scan today proving the parcel is still moving.",
    policyRule:
      "Acknowledge the missed EDD honestly instead of quoting it as valid, highlight today's newest scan, include both courier follow-up phrases, and reassure under Shopee Guarantee.",
    guideIds: ["find-order", "return-refund"],
    sampleInput:
      "Order #261020BR19K4 (Tracking BR2655432100Q, Estimated Delivery 08/11/2026, Latest Logistic Update: Today - In transit to local hub) > CX asks why it is past the date.",
    rows: [
      {
        section: "Greeting & Empathy",
        english:
          "Hello! We sincerely apologize that your order has not arrived yet. We completely understand your concern and frustration.",
        portuguese:
          "Olá! Pedimos sinceras desculpas por seu pedido ainda não ter chegado. Entendemos completamente a sua preocupação e frustração.",
      },
      {
        section: "Fresh scan today",
        english:
          "We checked your tracking information and can see that there was actually a new update today, [DATE]. Your order is still in transit and actively moving through the logistics network.",
        portuguese:
          "Verificamos o rastreamento e podemos ver que houve uma nova atualização hoje, [DATA]. O seu pedido ainda está em trânsito e seguindo ativamente pela rede de logística.",
        highlight: true,
      },
      {
        section: "Missed EDD honesty",
        english:
          "The original estimated delivery date was [DATE], and we apologize for this delay—international shipments can sometimes take longer due to customs processing and local distribution.",
        portuguese:
          "A data estimada de entrega original era [DATA], e pedimos desculpas por esse atraso — envios internacionais às vezes levam mais tempo devido à alfândega e à distribuição local.",
      },
      {
        section: "Follow-up action",
        english:
          "Please rest assured that we follow up this to courier and we expedite follow your order to courier to check the current status and request the fastest possible delivery.",
        portuguese:
          "Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora para verificar a situação atual e solicitar a entrega mais rápida possível.",
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Your order has not been lost—today's update confirms it is still moving toward delivery, and your payment remains fully protected by Shopee Guarantee.",
        portuguese:
          "O seu pedido não foi perdido — a atualização de hoje confirma que ele continua em movimento para entrega, e o seu pagamento continua totalmente protegido pela Garantia Shopee.",
        highlight: true,
      },
      {
        section: "Closing",
        english:
          "If you do not receive your order within the next few days, please feel free to contact us again.",
        portuguese:
          "Se você não receber o seu pedido nos próximos dias, sinta-se à vontade para entrar em contato conosco novamente.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Highlight Today's Scan + Courier Follow-Up",
        cxTrigger: "Past estimated delivery date, but tracking has a new scan today",
        rows: [
          {
            section: "Greeting & Empathy",
            english:
              "Hello! We sincerely apologize that your order has not arrived yet. We completely understand your concern and frustration.",
            portuguese:
              "Olá! Pedimos sinceras desculpas por seu pedido ainda não ter chegado. Entendemos completamente a sua preocupação e frustração.",
          },
          {
            section: "Fresh scan today",
            english:
              "We checked your tracking information and can see that there was actually a new update today, [DATE]. Your order is still in transit and actively moving through the logistics network.",
            portuguese:
              "Verificamos o rastreamento e podemos ver que houve uma nova atualização hoje, [DATA]. O seu pedido ainda está em trânsito e seguindo ativamente pela rede de logística.",
            highlight: true,
          },
          {
            section: "Missed EDD & Follow-up",
            english:
              "We apologize that the original estimated date ([DATE]) has passed; please rest assured that we follow up this to courier and we expedite follow your order to courier for the fastest delivery.",
            portuguese:
              "Pedimos desculpas pois o prazo estimado original ([DATA]) já passou; fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Your order has not been lost and your payment remains fully protected by Shopee Guarantee.",
            portuguese:
              "O seu pedido não foi perdido e o seu pagamento continua totalmente protegido pela Garantia Shopee.",
            highlight: true,
          },
        ],
      },
    ],
  },
  {
    id: "s23",
    number: 23,
    title: "Escalation — Threats, Complaints, Lawyer",
    category: ScenarioCategory.DELAYED,
    whenToUse:
      "Customer is angry and threatens to report the store, go to Procon/Reclame Aqui, sue, or hire a lawyer over a delay.",
    policyRule:
      "Stay calm and never argue. Never promise a fixed delivery day. Explain status, include both courier follow-up phrases + Shopee Guarantee, and only mention Return/Refund if CX demands money back.",
    guideIds: ["return-refund", "contact-shopee-cs", "refund-sla"],
    sampleInput:
      "Order #261019BR77X2 (Stuck in Brazil customs inspection) > CX says: 'This is a scam! If you don't deliver tomorrow I will report you to Procon and call my lawyer!'",
    rows: [
      {
        section: "Calm Empathy",
        english:
          "Hello! We sincerely apologize for the delay and for the frustration this has caused. We completely understand your concern regarding your order.",
        portuguese:
          "Olá! Pedimos sinceras desculpas pela demora e pela frustração que isso causou. Entendemos completamente a sua preocupação em relação ao seu pedido.",
        highlight: true,
      },
      {
        section: "Status & Context",
        english:
          "We checked your tracking and can confirm your order is currently [STATUS] in Brazil, which is processed by local authorities/carriers and outside our shop's direct control.",
        portuguese:
          "Verificamos o rastreamento e confirmamos que o seu pedido está atualmente [STATUS] no Brasil, um processo conduzido pelas autoridades/transportadoras locais e fora do controle direto da loja.",
      },
      {
        section: "Follow-up action",
        english:
          "Please rest assured that we follow up this to courier and we expedite follow your order to courier to check the status and request the fastest possible release and delivery.",
        portuguese:
          "Fique tranquilo, pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora para verificar a situação e solicitar a liberação e entrega mais rápidas possíveis.",
        highlight: true,
      },
      {
        section: "If refund is demanded",
        english:
          'Your order has not been lost; however, if you prefer to proceed with a refund (once eligible in your order status), please tap the "Return/Refund" button in your Shopee app so Shopee can review your case.',
        portuguese:
          'O seu pedido não foi perdido; porém, caso prefira prosseguir com um reembolso (quando disponível no pedido), toque no botão "Devolução/Reembolso" no aplicativo da Shopee para análise.',
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Rest assured your payment is 100% protected by Shopee Guarantee, and we are doing everything within our reach on our side to help.",
        portuguese:
          "Fique tranquilo, pois o seu pagamento está 100% protegido pela Garantia Shopee e estamos fazendo tudo ao nosso alcance do nosso lado para ajudar.",
        highlight: true,
      },
      {
        section: "Closing",
        english: "We truly appreciate your patience and understanding.",
        portuguese: "Agradecemos sinceramente a sua paciência e compreensão.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Calm De-Escalation (No Refund Demanded Yet)",
        cxTrigger: "CX threatens Procon, lawyer, or reporting due to delay",
        rows: [
          {
            section: "Calm Empathy",
            english:
              "Hello! We sincerely apologize for the delay and for the frustration this has caused. We completely understand your concern regarding your order.",
            portuguese:
              "Olá! Pedimos sinceras desculpas pela demora e pela frustração que isso causou. Entendemos completamente a sua preocupação em relação ao seu pedido.",
            highlight: true,
          },
          {
            section: "Status & Follow-up",
            english:
              "We checked your tracking ([STATUS]); please rest assured that we follow up this to courier and we expedite follow your order to courier to request the fastest possible release and delivery.",
            portuguese:
              "Verificamos o rastreamento ([STATUS]); fique tranquilo pois nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora para solicitar a entrega mais rápida possível.",
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your order has not been lost and your payment is 100% protected by Shopee Guarantee while the courier completes delivery.",
            portuguese:
              "Fique tranquilo, pois o seu pedido não foi perdido e o seu pagamento está 100% protegido pela Garantia Shopee enquanto a transportadora conclui a entrega.",
            highlight: true,
          },
        ],
      },
      {
        id: "demands-refund",
        label: "2. Escalation + CX Demands Money Back",
        cxTrigger: "Angry CX threatens legal action and demands their money back",
        rows: [
          {
            section: "Calm Empathy",
            english:
              "We completely understand your frustration and sincerely apologize for this experience.",
            portuguese:
              "Entendemos perfeitamente a sua frustração e pedimos sinceras desculpas por essa experiência.",
            highlight: true,
          },
          {
            section: "Follow-up & Return/Refund",
            english:
              'While we follow up this to courier and we expedite follow your order to courier, if you wish to proceed with a refund, please tap "Return/Refund" in your Shopee app (or use Shopee\'s webform while within the estimated window) so Shopee\'s protection team can assist directly.',
            portuguese:
              'Enquanto nós acompanhamos isso junto à transportadora e aceleramos o acompanhamento do seu pedido junto à transportadora, caso deseje prosseguir com o reembolso, toque em "Devolução/Reembolso" no aplicativo da Shopee (ou pelo formulário oficial se ainda no prazo).',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your money is 100% protected by Shopee Guarantee and will be refunded immediately once approved.",
            portuguese:
              "Fique tranquilo, pois o seu dinheiro está 100% protegido pela Garantia Shopee e será reembolsado imediatamente assim que aprovado.",
            highlight: true,
          },
        ],
      },
    ],
  },
  {
    id: "s24",
    number: 24,
    title: "Payment / Installment Inquiry (Airpay, Credit Card)",
    category: ScenarioCategory.PLATFORM,
    whenToUse:
      "Customer asks about Airpay, credit card installments, charged amounts, duplicate charges, or payment method details.",
    policyRule:
      "Never confirm a charged amount as the seller. Clarify billing/installments are handled solely by Shopee and redirect to Shopee Help Center, with Shopee Guarantee assurance.",
    guideIds: ["contact-shopee-cs", "refund-sla"],
    sampleInput:
      "Order #261112BR61H8 > CX asks: 'Why did my credit card show 3 installments via Airpay with a different amount?'",
    rows: [
      {
        section: "Greeting & Empathy",
        english:
          "Hello! Thank you for contacting us about your payment, and we understand your concern regarding the charges or installments.",
        portuguese:
          "Olá! Obrigado por entrar em contato conosco sobre o seu pagamento e entendemos a sua preocupação com os valores ou parcelamento.",
      },
      {
        section: "Out of scope",
        english:
          "Please kindly note that payment processing, installments, Airpay transactions, and billing are handled entirely by the Shopee platform and are outside our store's scope of support.",
        portuguese:
          "Por favor, observe que o processamento de pagamentos, parcelamentos, transações Airpay e cobranças são tratados inteiramente pela plataforma Shopee e estão fora do alcance do suporte da nossa loja.",
        highlight: true,
      },
      {
        section: "Redirect to Shopee",
        english:
          'For questions about installments or charged amounts, please contact Shopee\'s official customer service directly via "Me" -> "Help Center" / "Customer Service" in the app so they can check your payment details securely.',
        portuguese:
          'Para dúvidas sobre parcelamentos ou valores cobrados, entre em contato diretamente com o atendimento oficial da Shopee em "Eu" -> "Central de Ajuda" / "Atendimento" para que verifiquem os detalhes do pagamento com segurança.',
        highlight: true,
      },
      {
        section: "Assurance",
        english:
          "Rest assured your payment and account are protected by Shopee Guarantee, and Shopee's support team can resolve any billing question directly.",
        portuguese:
          "Fique tranquilo, pois o seu pagamento e a sua conta estão protegidos pela Garantia Shopee, e o suporte da Shopee poderá resolver qualquer dúvida de cobrança diretamente.",
        highlight: true,
      },
      {
        section: "Closing",
        english:
          "We apologize for not being able to check payment details directly, and we appreciate your understanding.",
        portuguese:
          "Pedimos desculpas por não podermos consultar os detalhes financeiros diretamente e agradecemos a sua compreensão.",
      },
    ],
    paths: [
      {
        id: "initial",
        label: "1. Redirect Installments / Billing to Shopee",
        cxTrigger: "CX asks about credit card installments, Airpay, or duplicate charges",
        rows: [
          {
            section: "Greeting & Empathy",
            english:
              "Hello! Thank you for contacting us about your payment, and we understand your concern regarding the charges or installments.",
            portuguese:
              "Olá! Obrigado por entrar em contato conosco sobre o seu pagamento e entendemos a sua preocupação com os valores ou parcelamento.",
          },
          {
            section: "Out of scope",
            english:
              "Please kindly note that payment processing, installments, Airpay transactions, and billing are handled entirely by the Shopee platform and are outside our store's scope of support.",
            portuguese:
              "Por favor, observe que o processamento de pagamentos, parcelamentos, transações Airpay e cobranças são tratados inteiramente pela plataforma Shopee e estão fora do alcance do suporte da nossa loja.",
            highlight: true,
          },
          {
            section: "Redirect to Shopee",
            english:
              'Please contact Shopee Support directly via "Me" -> "Help Center" / "Customer Service" in the app so they can securely verify your billing and installments.',
            portuguese:
              'Por favor, entre em contato diretamente com o atendimento da Shopee em "Eu" -> "Central de Ajuda" / "Atendimento" no app para verificarem suas cobranças e parcelas com segurança.',
            highlight: true,
          },
          {
            section: "Assurance",
            english:
              "Rest assured your payment and account are protected by Shopee Guarantee.",
            portuguese:
              "Fique tranquilo, pois o seu pagamento e a sua conta estão protegidos pela Garantia Shopee.",
            highlight: true,
          },
        ],
      },
    ],
  },
];
