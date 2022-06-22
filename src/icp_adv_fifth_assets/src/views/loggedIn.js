import { icp_adv_fifth } from "../../../declarations/icp_adv_fifth";
import { ActorSubclass } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { html, render } from "lit-html";
import { Principal } from "@dfinity/principal";
import { renderIndex } from ".";
// import { _SERVICE } from "../../../declarations/whoami/whoami.did";

const content = () => html`<section class="container">

    <h1>IC DAO Demo</h1>
    <h2>You are authenticated!</h2>
    <div>
        <label>Your Identity : </label>
        <label id="whoami"></label>
        <button id="logout" style="float:right">log out</button>
    </div>
    ------------------------------------------------------------------
    <div>
        <H3>Team Member List:</H3>
        <input id="input_member" placeholder="input principal here"></input>
        <button id="btn_add_member">add member</button>
        <button id="btn_del_member">delete member</button>
        <section id="members"></section>
        <!--<button id="refresh_canister">refresh canisters</button>-->
    </div>
    ------------------------------------------------------------------
    <div>
        <section>
            <H3>Canister List:</H3>
            <button id="refresh_canister" style="float:right">refresh canisters</button>
            <button id="btn_create_canister" style="float:right">create canister</button>
        </section>
        <section>
            <input id="input_proposal_text" placeholder="input proposal content"></input>
            <select id="selectList">
                <option>install Code</option>
                <option>start</option>
                <option>stop</option>
                <option>delete</option>
                <option>add Restriction</option>
                <option>remove Restriction</option>
            </select>
            <input type="file" id="file" />
            <input id="input_proposal_target" placeholder="input target canister"></input>
            <button id="btn_canister_proposal">initiate canister proposal</button>
        </section>
        <section id="canisters"></section>
    </div>
    ------------------------------------------------------------------
    <div>
        <p>
            <H3>Proposal List:</H3>
            <button id="refresh_proposal" style="float:right">refresh proposals</button>
            <button id="btn_create_proposal" style="float:right">Initiate a proposal</button>
        </p>
        <section id="proposals"></section>
    </div>
</section>`;

export const renderLoggedIn = (actor, authClient) => {
    render(content(), document.getElementById("pageContent"));

    //载入调用者identity
    async function load_identity() {
        try {
            const response = await actor.whoami();
            console.log("identity :" + response);
            document.getElementById("whoami").innerHTML = response.toString();
        } catch (error) {
            console.error(error);
        };
    };

  document.getElementById("logout").onclick = async () => {
    await authClient.logout();
    renderIndex();
  };

  document.getElementById("btn_add_member").onclick = async () => {
    let principal = document.getElementById("input_member").value;
    await icp_adv_fifth.add_proposal("add a member to group", {"addMember":null}, Principal.fromText(principal), []);
    load_proposals();
  };

  document.getElementById("btn_del_member").onclick = async () => {
    let principal = document.getElementById("input_member").value;
    await icp_adv_fifth.add_proposal("remove a member from group", {"delMember":null}, Principal.fromText(principal), []);
  };

  document.getElementById("btn_create_canister").onclick = async () => {
    await icp_adv_fifth.create_canister();
    load_canisters();
  };

  document.getElementById("btn_canister_proposal").onclick = async () => {
    createProposal();
    // load_proposals();
  };

// 载入提案列表
async function load_proposals() {
    let proposals_section = document.getElementById("proposals");
    var proposals = await icp_adv_fifth.get_proposals();
    console.log(proposals);
    proposals_section.replaceChildren([]);
    for (var i = 0; i< proposals.length; i++) {
        var table = document.createElement("table");
        table.border = 1;
        add_tr("proposal_id", proposals[i]["proposal_id"], table);
        add_tr("proposal_content", proposals[i]["proposal_content"], table);
        add_tr("proposal_maker", proposals[i]["proposal_maker"], table);
        add_tr("proposal_approvers", proposals[i]["proposal_approvers"], table);
        add_tr("proposal_completed", proposals[i]["proposal_completed"], table);
        add_tr("proposal_total", proposals[i]["proposal_total"], table);
        add_tr("proposal_exe_method", Object.keys(proposals[i]["proposal_exe_method"])[0], table);
        add_tr("proposal_exe_target", proposals[i]["proposal_exe_target"], table);
        add_tr("proposal_wasm_hash", proposals[i]["proposal_wasm_hash"].join(""), table);
        proposals_section.appendChild(table);

        let id = proposals[i]["proposal_id"];
        console.info("id : " + id);
        var o=document.createElement("input"); 
        o.type = "button" ; 
        o.value = "propose";
        o.addEventListener("click", async function(){
            await icp_adv_fifth.propose(id);
            load_proposals();});   
        proposals_section.appendChild(o);
    }
};

function add_tr(k, v, t){
    let tr = document.createElement("tr");
    let th = document.createElement("th");
    let td = document.createElement("td");
    th.innerText = k;
    td.innerText = v;
    tr.appendChild(th);
    tr.appendChild(td);
    t.appendChild(tr);
};
// 载入canister列表
async function load_canisters() {
    let sec_canister = document.getElementById("canisters");
    var canisters = await icp_adv_fifth.get_canisters();
    console.log(canisters);
    sec_canister.replaceChildren([]);
    for (var i = 0; i< canisters.length; i++) { 
        let can = document.createElement("p");
        can.innerText = canisters[i].canister 
                          + " : " + canisters[i].beRestricted;
        sec_canister.appendChild(can);
    }
}

// 载入团队成员列表
async function load_members() {
    let sec_members = document.getElementById("members");
    sec_members.style.fontSize = 5;
    var members = await icp_adv_fifth.allMembers();
    console.log(members);
    sec_members.replaceChildren([]);
    for (var i = 0; i< members.length; i++) { 
        let member = document.createElement("p");
        member.innerText = members[i];
        member.fontSize = 4;
        sec_members.appendChild(member);
    }
}

async function createProposal() {
    const content = document.getElementById('input_proposal_text').value;
    const file = document.getElementById('file').value;
    const selected = document.getElementById('selectList').selected;
    const target = document.getElementById('input_proposal_target').value;
    console.log("select : " + selected);

    arrayBuffer = await fileToBuf(file);
    console.log("file : " + arrayBuffer);
    
}

const fileToBuf = file => {
    return new Promise(resolve => {
        const fr = new FileReader()
        fr.readAsArrayBuffer(file)
        fr.addEventListener('loadend', (e) => {
        const buf = e.target.result
        resolve(buf)
        })
    })
};
  
  function load() { 
    console.log("windows load");
    let btn_refresh_proposal = document.getElementById("refresh_proposal");
    btn_refresh_proposal.onclick = load_proposals;
    let btn_refresh_canister = document.getElementById("refresh_canister");
    btn_refresh_canister.onclick = load_canisters;
  
    load_identity();
    load_members();
    load_canisters();
    load_proposals();
  }
  
  window.onload = load;
};