export type QuestionType = "text" | "textarea" | "yesno" | "file" | "files";

export interface AuditQuestion {
  id: string;
  section: string;
  sectionEn: string;
  questionZh: string;
  questionEn: string;
  type: QuestionType;
}

/** Accept attribute for file uploads: images and documents (PDF, PowerPoint, Excel). */
export const FILE_ACCEPT = ".pdf,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp";

export const AUDIT_QUESTIONS: AuditQuestion[] = [
  // Basic info (keep for factory name/address/expertise on list)
  { id: "q1", section: "基本信息", sectionEn: "Basic info", questionZh: "工厂名称", questionEn: "Factory name", type: "text" },
  { id: "q2", section: "基本信息", sectionEn: "Basic info", questionZh: "工厂地址（省/市/区）", questionEn: "Address (Province/City/District)", type: "text" },
  { id: "q3", section: "基本信息", sectionEn: "Basic info", questionZh: "主营业务/专长", questionEn: "Expertise / Main business", type: "textarea" },

  // A. Receiving
  { id: "A1", section: "A. 收货", sectionEn: "A. Receiving", questionZh: "从接收到进料质量需要多长时间？", questionEn: "How long does it take from receiving to Incoming Quality?", type: "text" },
  { id: "A2", section: "A. 收货", sectionEn: "A. Receiving", questionZh: "这个区域有多少材料？", questionEn: "How much material is there in this area?", type: "text" },
  { id: "A3", section: "A. 收货", sectionEn: "A. Receiving", questionZh: "卸货码头外面有箱子吗？", questionEn: "Any boxes sitting outside on the unloading docks?", type: "text" },
  { id: "A4", section: "A. 收货", sectionEn: "A. Receiving", questionZh: "湿度/温度控制？", questionEn: "Humidity/temperature control?", type: "textarea" },

  // B. Incoming Quality
  { id: "B1", section: "B. 来料质量", sectionEn: "B. Incoming Quality", questionZh: "通过IQC部门的物料比率是多少？", questionEn: "What is the rate of material that gets put through the IQC department?", type: "text" },
  { id: "B2", section: "B. 来料质量", sectionEn: "B. Incoming Quality", questionZh: "给我们看看你的质量管理体系（QMS），并为我们拉一份（包含缺陷的）报告。", questionEn: "Show us your QMS (quality management system) and pull a report (with defects) for us.", type: "file" },
  { id: "B3", section: "B. 来料质量", sectionEn: "B. Incoming Quality", questionZh: "给我们看看你的ISO 9001认证以及确保明年通过认证的流程。", questionEn: "Show us your ISO 9001 certification and the processes to ensure you will pass this next year.", type: "file" },

  // C. Incoming Warehouse
  { id: "C1", section: "C. 来料仓库", sectionEn: "C. Incoming Warehouse", questionZh: "给我们看看你的高成本零部件仓库。", questionEn: "Show us your high-cost component warehouse.", type: "file" },
  { id: "C2", section: "C. 来料仓库", sectionEn: "C. Incoming Warehouse", questionZh: "给我们看看你的产品生命周期管理（PLM）系统，并展示从货架上取下特定SKU物品的流程。也给我们展示放回的流程。", questionEn: "Show us your PLM system, and show us the process of pulling a specific SKU item off the shelf. Show us also the process to put it back.", type: "files" },

  // D. Kitting area
  { id: "D1", section: "D. 配套区", sectionEn: "D. Kitting area", questionZh: "给我们看看你们如何使用精益/改善流程。", questionEn: "Show us how you use lean/kaizen processes.", type: "file" },
  { id: "D2", section: "D. 配套区", sectionEn: "D. Kitting area", questionZh: "给我们看看标签系统和运输箱。", questionEn: "Show us the labelling system and transport bins.", type: "file" },

  // E. Fabrication
  { id: "E1", section: "E. 加工", sectionEn: "E. Fabrication", questionZh: "给我们看看某些子组件是如何（以及为什么）生产的。", questionEn: "Show us how (and why) certain subassemblies are produced.", type: "file" },

  // F. Production
  { id: "F1", section: "F. 生产", sectionEn: "F. Production", questionZh: "你们的主要流程是什么（注塑成型、金属冲压、PCB组装、最终组装），每个团队有多少人？", questionEn: "What are your main processes (Injection molding, metal stamping, PCB assembly, final assembly) and how many people do you have on each team?", type: "textarea" },
  { id: "F2", section: "F. 生产", sectionEn: "F. Production", questionZh: "给我们看看你们用于管理SOP、培训以及线上和线下测试的系统。从中拉一份报告。你们如何进行SOP的版本控制？", questionEn: "Show us the systems you use to manage SOP's, training and in-line and end-of-line testing. Pull a report from this. How do you version-control SOP's?", type: "file" },
  { id: "F3", section: "F. 生产", sectionEn: "F. Production", questionZh: "（仅限PCBA）给我们看看你们的焊锡膏冰箱，以及取出焊锡膏用于生产的流程。", questionEn: "(PCBA only) Show us your soldering paste fridge, and the process of taking out soldering paste for production.", type: "file" },
  { id: "F4", section: "F. 生产", sectionEn: "F. Production", questionZh: "给我们举例/讲一个故事，说明内部如何处理轻微和重大的工程变更请求（ECR）。", questionEn: "Show us an example/tell a story of how both a minor and a major ECR (engineering change request) get handled internally.", type: "textarea" },
  { id: "F5", section: "F. 生产", sectionEn: "F. Production", questionZh: "培训是如何记录的，以及体力劳动员工多久进行一次再培训？", questionEn: "How is training logged, and how often are manual-labor staff retrained?", type: "textarea" },
  { id: "F6", section: "F. 生产", sectionEn: "F. Production", questionZh: "给我们看看生产线工人的徽章背面。", questionEn: "Show us the back of a badge from a line-worker.", type: "file" },
  { id: "F7", section: "F. 生产", sectionEn: "F. Production", questionZh: "给我们看看一条正在运行的装配线，并解释正在进行的每一步以及为什么这样做。", questionEn: "Show us an assembly line currently being operated and explain every step being done, and why they are done that way.", type: "file" },

  // G. In-process inventory
  { id: "G1", section: "G. 在制品库存", sectionEn: "G. In-process inventory", questionZh: "给我们看看你们的库存缓冲区域以及如何处理。", questionEn: "Show us your inventory buffer area and how it is handled.", type: "file" },

  // H. Packing
  { id: "H1", section: "H. 包装", sectionEn: "H. Packing", questionZh: "手动包装还是自动化包装？", questionEn: "Manual vs automated packaging?", type: "text" },
  { id: "H2", section: "H. 包装", sectionEn: "H. Packing", questionZh: "包装仓库中的湿度控制？", questionEn: "Humidity control in packaging warehouse?", type: "textarea" },

  // I. Finished good inventory
  { id: "I1", section: "I. 成品库存", sectionEn: "I. Finished good inventory", questionZh: "温度/湿度控制？", questionEn: "Temp/humidity control?", type: "textarea" },

  // J. Shipping
  { id: "J1", section: "J. 发货", sectionEn: "J. Shipping", questionZh: "请描述你们的发货流程与管控。", questionEn: "Describe your shipping process and controls.", type: "textarea" },

  // K. QA
  { id: "K1", section: "K. 质量保证", sectionEn: "K. QA", questionZh: "向我们介绍你们的OQC生产线经理。", questionEn: "Introduce us to your OQC line manager.", type: "textarea" },
  { id: "K2", section: "K. 质量保证", sectionEn: "K. QA", questionZh: "给我们举例说明一个轻微缺陷以及如何处理。", questionEn: "Show us an example of a minor defect, and how it is handled.", type: "file" },
  { id: "K3", section: "K. 质量保证", sectionEn: "K. QA", questionZh: "给我们举例说明一个重大缺陷以及如何处理。", questionEn: "Show us an example of a major defect and how it is handled.", type: "file" },
  { id: "K4", section: "K. 质量保证", sectionEn: "K. QA", questionZh: "给我们看看你们的内部测试设备清单。", questionEn: "Show us a list of your in-house test equipment.", type: "file" },
  { id: "K5", section: "K. 质量保证", sectionEn: "K. QA", questionZh: "给我们看看实际的测试设备。", questionEn: "Show us the actual test equipment.", type: "file" },
  { id: "K6", section: "K. 质量保证", sectionEn: "K. QA", questionZh: "给我们看看你们如何确保设备定期校准。", questionEn: "Show us how you ensure the equipment is regularly calibrated.", type: "file" },

  // L. Rework
  { id: "L1", section: "L. 返工", sectionEn: "L. Rework", questionZh: "请描述返工流程与管控。", questionEn: "Describe your rework process and controls.", type: "textarea" },

  // M. Quarantine
  { id: "M1", section: "M. 隔离", sectionEn: "M. Quarantine", questionZh: "请描述隔离流程与管控。", questionEn: "Describe your quarantine process and controls.", type: "textarea" },

  // Sub-supplier selection process
  { id: "SS1", section: "子供应商选择", sectionEn: "Sub-supplier selection process", questionZh: "你们最大的子组件供应商是谁？", questionEn: "Who are your biggest sub-component suppliers?", type: "textarea" },
  { id: "SS2", section: "子供应商选择", sectionEn: "Sub-supplier selection process", questionZh: "我们可以直接与你们的采购团队经理交谈吗？", questionEn: "Can we talk directly with your sourcing-team's manager?", type: "textarea" },

  // Sourcing
  { id: "SR1", section: "采购", sectionEn: "Sourcing", questionZh: "给我们看看进入你们AVL（批准供应商列表）的流程。", questionEn: "Show us the process to get on your AVL (approved vendor list).", type: "file" },
  { id: "SR2", section: "采购", sectionEn: "Sourcing", questionZh: "你们有哪些方法可以更快地获取物品（现货市场），以及在此过程中如何确保质量水平。", questionEn: "Which methods do you have to get items faster (spot-market) and how do you ensure quality levels while doing so.", type: "textarea" },

  // Project management
  { id: "PM1", section: "项目管理", sectionEn: "Project management", questionZh: "解释你们的新产品导入（NPI）流程。谈谈你们的阶段门以及每个阶段门如何控制。", questionEn: "Explain your NPI process. Talk about your stage-gates and how each stage-gate is controlled.", type: "textarea" },
  { id: "PM2", section: "项目管理", sectionEn: "Project management", questionZh: "向我们介绍你们的研发经理。", questionEn: "Introduce us to your R&D manager.", type: "textarea" },
  { id: "PM3", section: "项目管理", sectionEn: "Project management", questionZh: "解释你们的APQP（产品质量先期策划）工具。", questionEn: "Explain your APQP (Advanced Product Quality Planning) tool.", type: "textarea" },

  // SOP management
  { id: "SOP1", section: "SOP管理", sectionEn: "SOP management", questionZh: "解释SOP上的每个项目。", questionEn: "Explain every item on the SOP.", type: "textarea" },
  { id: "SOP2", section: "SOP管理", sectionEn: "SOP management", questionZh: "需要关注的项目：操作编号、联系人、日期、批准的变更、操作描述、区域、设置、流程、SOP、工装夹具、材料、设置时间、循环时间、劳动力（每小时多少循环）。", questionEn: "Items to look for: Operation number, contact person, date, approved changes, operation description, area, setup, process, SOP, Tooling and fixtures, materials, setup time, cycle time, labour (how many cycles/hour).", type: "textarea" },

  // Sustainability processes
  { id: "SU1", section: "可持续发展", sectionEn: "Sustainability processes", questionZh: "给我们看看生产中和生产后如何管理废弃物。", questionEn: "Show us how waste is managed, both in and after production.", type: "file" },
  { id: "SU2", section: "可持续发展", sectionEn: "Sustainability processes", questionZh: "给我们看看你们的ISO 14000和45001认证，以及如何确保获得此认证。", questionEn: "Show us your ISO 14000 and 45001 certification, and how certification of this is ensured.", type: "file" },
  { id: "SU3", section: "可持续发展", sectionEn: "Sustainability processes", questionZh: "向我们介绍你们的可持续发展官员/团队。", questionEn: "Introduce us to your sustainability officer/team.", type: "textarea" },
  { id: "SU4", section: "可持续发展", sectionEn: "Sustainability processes", questionZh: "给我们看看你们的能源账单，以及其中有多少来自可持续能源。告诉我们你们将来是否以及如何改进这一点。", questionEn: "Show us your energy bill and how much of that comes from sustainable sources. Tell us if and how you will improve this in the future.", type: "file" },
  { id: "SU5", section: "可持续发展", sectionEn: "Sustainability processes", questionZh: "当出现重大缺陷时，产品部件是否会重新投入生产？你们如何管理组件的质量/再利用？质量控制团队中谁参与了这个过程？", questionEn: "When there is a major defect, are parts of the products put back in production? And how do you manage quality/re-use of components? Who from the QC team is involved in this process?", type: "textarea" },
  { id: "SU6", section: "可持续发展", sectionEn: "Sustainability processes", questionZh: "给我们看看你们的ROHS和WEEE合规性，以及如何确保。这些测试是内部进行还是外包？", questionEn: "Show us your ROHS and WEEE compliance, and how they are ensured. Do you do these tests in-house or outsourced?", type: "file" },

  // Cost-down regimes
  { id: "CD1", section: "成本削减", sectionEn: "Cost-down regimes", questionZh: "你们多久与供应商进行一次价格谈判？", questionEn: "How often do you do price negotiations with your suppliers?", type: "text" },
  { id: "CD2", section: "成本削减", sectionEn: "Cost-down regimes", questionZh: "你们如何管理供应商变更？在进行供应商变更时，你们希望控制哪些重要因素？", questionEn: "How do you manage a change of suppliers? What are important factors you want to control when doing a supplier change?", type: "textarea" },
  { id: "CD3", section: "成本削减", sectionEn: "Cost-down regimes", questionZh: "有哪些制度用于进行成本削减分析？", questionEn: "What regimes are in place to do cost-down analysis?", type: "textarea" },
  { id: "CD4", section: "成本削减", sectionEn: "Cost-down regimes", questionZh: "对于你们直接生产的物品，有哪些流程用于进行成本削减？", questionEn: "What are the processes in place to do cost-down for items manufactured directly by you?", type: "textarea" },

  // Other things we will assess
  { id: "O1", section: "其他评估项", sectionEn: "Other assessment", questionZh: "工厂清洁度", questionEn: "Factory cleanliness", type: "textarea" },
  { id: "O2", section: "其他评估项", sectionEn: "Other assessment", questionZh: "防护设备程序和合规性", questionEn: "Protective equipment procedures and compliance", type: "textarea" },
  { id: "O3", section: "其他评估项", sectionEn: "Other assessment", questionZh: "环境控制（温度、湿度、暖通空调系统、风淋室及其合规性）", questionEn: "Environmental control (temp, humidity, HVAC system, air showers and compliance to them)", type: "textarea" },
  { id: "O4", section: "其他评估项", sectionEn: "Other assessment", questionZh: "操作员培训", questionEn: "Operator training", type: "textarea" },
  { id: "O5", section: "其他评估项", sectionEn: "Other assessment", questionZh: "ESD控制，特别是电池和电子产品组装。腕带、指套、ESD袋、ESD运输托盘", questionEn: "ESD control, especially for battery and electronics assembly. Wrist-band, fingercots, ESD bags, ESD transport trays", type: "textarea" },
  { id: "O6", section: "其他评估项", sectionEn: "Other assessment", questionZh: "焊接质量控制。", questionEn: "Soldering quality control.", type: "textarea" },
  { id: "O7", section: "其他评估项", sectionEn: "Other assessment", questionZh: "活动生产线上的实际SOP使用情况。", questionEn: "Actual SOP usage on an active line.", type: "textarea" },
  { id: "O8", section: "其他评估项", sectionEn: "Other assessment", questionZh: "工作区域组织，包括标签清晰的进料、工具和出料。", questionEn: "Work area organization with well-labeled incoming material, tools, and outgoing materials.", type: "textarea" },
  { id: "O9", section: "其他评估项", sectionEn: "Other assessment", questionZh: "库存管理，先进先出或后进先出，易于查看库存水平，料箱组织良好，货架组织良好。", questionEn: "Inventory management, FIFO or LIFO, easy to see inventory levels, bins well organised, shelves well organised.", type: "textarea" },
  { id: "O10", section: "其他评估项", sectionEn: "Other assessment", questionZh: "库存隔离，高价值库存，给我们看看特定客户的单独库存。", questionEn: "Inventory segregation, high-value inventory, show us separate inventory for a specific customer.", type: "file" },
  { id: "O11", section: "其他评估项", sectionEn: "Other assessment", questionZh: "MRP（物料资源计划）系统。给我们看看物料准备情况报告。我们想亲自查看。", questionEn: "MRP (material resource planning) system. Show us a material readiness report. We want to see it in-person.", type: "file" },
  { id: "O12", section: "其他评估项", sectionEn: "Other assessment", questionZh: "物料处理和可追溯性。如果将子组件/部件从生产线上取下会发生什么。给我们看看正在运行的生产线上的这个过程。", questionEn: "Material handling and traceability. What happens if you take a subassembly/component off the line. Show us this process on a running line.", type: "file" },
  { id: "O13", section: "其他评估项", sectionEn: "Other assessment", questionZh: "轻微或重大缺陷的隔离程序。这些物品最终会回到生产线上吗？", questionEn: "Quarantine procedures for minor or major defects. Do the items end up back on the line?", type: "textarea" },
  { id: "O14", section: "其他评估项", sectionEn: "Other assessment", questionZh: "IQC系统和房间检查。", questionEn: "IQC system and room inspection.", type: "textarea" },
  { id: "O15", section: "其他评估项", sectionEn: "Other assessment", questionZh: "道德和SA8000合规性。", questionEn: "Ethics and SA8000 compliance.", type: "textarea" },
  { id: "O16", section: "其他评估项", sectionEn: "Other assessment", questionZh: "设备质量和使用年限。", questionEn: "Equipment quality and age.", type: "textarea" },
  { id: "O17", section: "其他评估项", sectionEn: "Other assessment", questionZh: "预防性维护和过程控制。", questionEn: "Preventative maintenance and process control.", type: "textarea" },
  { id: "O18", section: "其他评估项", sectionEn: "Other assessment", questionZh: "纠正措施及其控制。", questionEn: "Corrective actions and control of those.", type: "textarea" },
];

export function getQuestionLabelsEn(): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const q of AUDIT_QUESTIONS) {
    labels[q.id] = q.questionEn;
  }
  return labels;
}

export function getQuestionLabelsZh(): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const q of AUDIT_QUESTIONS) {
    labels[q.id] = q.questionZh;
  }
  return labels;
}

export function getSections(): { section: string; sectionEn: string }[] {
  const seen = new Set<string>();
  return AUDIT_QUESTIONS.filter((q) => {
    if (seen.has(q.section)) return false;
    seen.add(q.section);
    return true;
  }).map((q) => ({ section: q.section, sectionEn: q.sectionEn }));
}
