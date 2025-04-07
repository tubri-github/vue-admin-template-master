<template>
  <div class="app-container">
    <el-form ref="form" :model="form" label-width="120px" v-loading="listLoading">
      <el-form-item label="Loan Number">
        <el-input v-model="form.loanNumber" />
      </el-form-item>
      <el-form-item label="Transaction Type">
        <el-select v-model="form.transactionType" placeholder="please select transaction type" @change="changeType($event)">
          <el-option
            v-for="item in loanType"
            :key="item.key"
            :label="item.label"
            :value="item.key"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Loan Date">
        <el-date-picker v-model="form.loanDate" type="date" placeholder="Pick a date" style="width: 100%;" />
      </el-form-item>
      <el-form-item label="Closed" @change="loanCloseSwitch">
        <el-switch v-model="ifClosed" />
      </el-form-item>
      <el-form-item label="Date Closed">
        <el-date-picker v-model="form.dateClosed" type="date" placeholder="Pick a date" style="width: 100%;" />
      </el-form-item>
      <el-form-item label="Text1">
        <el-input v-model="form.text1" />
      </el-form-item>
      <el-form-item label="Text2">
        <el-input v-model="form.text2" />
      </el-form-item>

      <el-form-item label="Loan People ID" prop="loanPplID">
        <el-select v-model="form.loanPplID" filterable placeholder="please select Loan People">
          <el-option
            v-for="item in loanPeople"
            :key="item.LoanPeopleID"
            :label="item.FirstName + ' ' + item.LastName"
            :value="item.LoanPeopleID"
          />
        </el-select>
      </el-form-item>
      <h5>Agents</h5>
      <el-form-item label="Agent ID">
        <el-input v-model="form.agentID" />
      </el-form-item>
      <el-form-item label="Loan Agents">
        <el-input v-model="form.loanAgents" />
      </el-form-item>
      <el-form-item label="OrganizationID">
        <el-input v-model="form.organizationID" />
      </el-form-item>
      <h5>Shipping</h5>
      <el-form-item label="ShipToAddress">
        <el-input v-model="form.shipToAddress" />
      </el-form-item>
      <el-form-item label="ShipToCity">
        <el-input v-model="form.shipToCity" />
      </el-form-item>
      <el-form-item label="ShipToState">
        <el-input v-model="form.shipToState" />
      </el-form-item>
      <el-form-item label="ShipToZipCode">
        <el-input v-model="form.shipToZipCode" />
      </el-form-item>
      <el-form-item label="ShipToCountry">
        <el-input v-model="form.shipToCountry" />
      </el-form-item>
      <el-form-item label="ShipToRemark">
        <el-input v-model="form.shipToRemark" />
      </el-form-item>
      <el-form-item label="ShipToMethod">
        <el-input v-model="form.shipToMethod" />
      </el-form-item>
      <el-form-item label="Add Loan Details">
        <el-button @click="addNewLot">Add</el-button>
        <el-table
          :data="form.loanDetails"
          border
          style="width: 100%">
          <el-table-column
            prop="CatalogNumber"
            label="Catalog Number"
            width="200">
            <template slot-scope="{row}">
              <el-input v-model.lazy="row.CatalogNumber" @focus="onfoucs(row)" @blur="blurUsername(row)" />
            </template>
          </el-table-column>
          <el-table-column
            prop="CatalogNumber"
            label="Catalog Number"
            width="200" v-if="false">
            <template slot-scope="{row}">
              <el-input v-model="row.PrimaryID" @focus="onfoucs(row)"/>
            </template>
          </el-table-column>
          <el-table-column
            prop="CatalogString"
            label="Catalog String"
            width="200">
            <template slot-scope="{row}">
              <span> {{row.PrimaryString}}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="Quantity"
            width="100">
            <template slot-scope="{row}">
              <el-input type="number" v-model.number="row.Quantity" @focus="onfoucs(row)"/>
            </template>
          </el-table-column>

          <el-table-column
            prop="Quantity Return"
            label="Quantity Return"
            width="100">
            <template slot-scope="{row}">
              <el-input type="number" v-model.number="row.QuantityReturned" @focus="onfoucs(row)"/>
            </template>
          </el-table-column>
          <el-table-column
            prop="Quantity Resolved"
            label="Quantity Resolved"
            width="100"> <template slot-scope="{row}">
            <el-input type="number" v-model.number="row.QuantityResolved" @focus="onfoucs(row)" />
          </template>
          </el-table-column>
          <el-table-column
            prop="DescriptionOfMaterial"
            label="DescriptionOfMaterial"
            width="180"> <template slot-scope="{row}">
            <el-input v-model.number="row.DescriptionOfMaterial" @focus="onfoucs(row)" />
          </template>
          </el-table-column>

          <el-table-column
            prop="In Comments"
            label="InComments"
            width="180"> <template slot-scope="{row}">
            <el-input v-model.number="row.InComments" @focus="onfoucs(row)" />
          </template>
          </el-table-column>

          <el-table-column
            prop="Out Comments"
            label="OutComments"
            width="180"> <template slot-scope="{row}">
            <el-input v-model.number="row.OutComments" @focus="onfoucs(row)" />
          </template>
          </el-table-column>

          <el-table-column
            prop="Remarks"
            label="Remarks"
            width="180"> <template slot-scope="{row}">
            <el-input v-model.number="row.Remarks" @focus="onfoucs(row)"/>
          </template>
          </el-table-column>

          <el-table-column
            label="Action">
<!--            <el-button-->
<!--              size="mini"-->
<!--            >Edit</el-button>-->
            <template slot-scope="{row,$index}">
            <el-button
              size="mini"
              type="danger" @click="handleDelete(row,$index)">Delete</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <el-form-item>
        <el-button v-if="form.status === 'new'" type="primary" @click="onSubmit">Create</el-button>
        <el-button v-if="form.status === 'edit'" type="primary" @click="onUpdate">Update</el-button>
        <el-button v-if="form.status === 'edit'"type="primary" @click="printLoan">Print</el-button>
        <el-button v-if="form.status === 'edit'"type="primary" @click="printPartialLabels">Print Partial Labels</el-button>
        <el-button v-if="form.status === 'edit'"type="primary" @click="exportExcel">Export to .xlsx</el-button>
        <el-button @click="onCancel">Cancel</el-button>
      </el-form-item>
    </el-form>

<!-- PRINT partials    -->
    <el-dialog :visible.sync=printDiablogVisible id="partial-label-print-dialog" :append-to-body="true" :z-index="3000">
      <el-button v-print="'#printPartials'">Print me </el-button>
      <div id="printPartials">
        <div class="lot-item-box" v-for="(item,index) in this.form.loanDetails" :key="item.PrimaryID">
          <el-row type="flex" justify="space-around" align="center">
            <el-col ><div class="header-title-info"> <h2><B> TULANE UNIVERSITY COLLECTIONS</B></h2> </div></el-col>
          </el-row>

          <el-row type="flex" justify="space-around" align="center">
            <el-col><div class="header-title-info"> <h3>Loan No.: {{ form.loanNumber }}</h3> </div></el-col>
          </el-row>

          <el-row class="label-item-row" type="flex" justify="space-around"  align="center">
            <el-col offset="1"><div class="label-item-content"> <span>Family Name</span> <input type="text" class="blank-signature-underline" :value="item.FamilyName" style="width:50%"> </div></el-col>
            <el-col><div class="label-item-content"> <span>Cat. No</span> <input type="text" class="blank-signature-underline" :value="item.CatalogNumber">  </div></el-col>
          </el-row>

          <el-row class="label-item-row" type="flex" justify="space-around">
            <el-col offset="1" span="3"><div class="label-item-content"> <span>Species</span> </div></el-col>
            <el-col  span="21"><div class="label-item-content"><input type="text" class="blank-signature-underline" :value="item.FullScientificName" style="width:100%"> </div></el-col>
          </el-row>


          <el-row class="label-item-row" type="flex" justify="space-around">
            <el-col offset="1"><div class="label-item-content"> <span>Dr.</span> <input type="text" class="blank-signature-underline" :value="item.Drainage"> </div></el-col>
            <el-col><div class="label-item-content"> <span>No. of Specimens</span> <input style="width:30%" type="text" class="blank-signature-underline" :value="item.Quantity + ' of ' + item.TotalNumber">  </div></el-col>
          </el-row>

          <el-row class="label-item-row" type="flex" justify="space-around">

            <el-col offset="1"><div class="label-item-content"> <span>State</span> <input type="text" class="blank-signature-underline" :value="item.LocalityState"> </div></el-col>
            <el-col><div class="label-item-content"> <span>County</span> <input type="text" class="blank-signature-underline" :value="item.LocalityCounty">  </div></el-col>
          </el-row>

          <el-row class="label-item-row" type="flex" >
            <el-col offset="1" span="3"><div class="label-item-content"> <span>Locality</span></div></el-col>
            <el-col span="21"><div class="label-item-content"> <el-input type="textarea" autosize class="label-textarea blank-signature-underline" :value="item.LocalityString"  style="width: 100%"></el-input></div></el-col>
          </el-row>

          <el-row class="label-item-row" type="flex" justify="space-around">
            <el-col offset="1"><div class="label-item-content"> <span>Col. Date</span> <input type="text" class="blank-signature-underline" :value="item.StartDate"> </div></el-col>
            <el-col><div class="label-item-content"> <span>Col. No.</span> <input type="text" class="blank-signature-underline" :value="item.FieldNo">  </div></el-col>
          </el-row>

          <el-row class="label-item-row" type="flex">
            <el-col offset="1"  span="3"><div class="label-item-content"><span>Col. by </span> </div></el-col>
            <el-col  span="21"><div class="label-item-content"><input type="text" class="blank-signature-underline" :value="item.VerbatimCollectors" style="width:100%"> </div></el-col>
          </el-row>
          <div style="page-break-after: always;"></div>

          <el-row type="flex" justify="space-around" align="center">
            <el-col ><div class="header-title-info"> <h2><B> NOTES </B></h2> </div></el-col>
          </el-row>
          <el-row type="flex" justify="space-around" align="center">
            <el-col><div class="header-title-info"> <h3>Loan No.: {{ form.loanNumber }}</h3> </div></el-col>
          </el-row>

          <el-row class="label-item-row" type="flex" justify="space-around"  align="center">
            <el-col offset="1"><div class="label-item-content"> <span>Family Name</span> <input type="text" class="blank-signature-underline" :value="item.FamilyName" style="width:50%"> </div></el-col>
            <el-col><div class="label-item-content"> <span>Cat. No</span> <input type="text" class="blank-signature-underline" :value="item.CatalogNumber">  </div></el-col>
          </el-row>

          <el-row class="label-item-row" type="flex">
            <el-col offset="1"  span="3"><div class="label-item-content"><span>Species </span> </div></el-col>
            <el-col  span="21"><div class="label-item-content"><input type="text" class="blank-signature-underline" :value="item.FullScientificName" style="width:100%"> </div></el-col>
          </el-row>

          <el-row class="label-item-row" type="flex" justify="space-around" style="margin-top:20px">
            <el-col offset="1"><div class="label-item-content"> <span>{{ item.Quantity + ' of ' + item.TotalNumber }} loaned to {{form.loanPeopleFullName}}</span>  </div></el-col>
          </el-row>
          <div style="page-break-after: always;"></div>
        </div>

      </div>
    </el-dialog>
<!-- PRINT Loans   -->
  <el-dialog id="invoice-print-dialog" width="90%" :visible.sync="printLoanDiablogVisible" :append-to-body="true" :z-index="3000">
<!--    <el-button v-print="'#printMe'">Print me </el-button>-->
    <el-button @click="generatePDF">Generate Loan PDF </el-button>
    <vue-html2pdf
      :show-layout="false"
      :float-layout="false"
      :enable-download="true"
      :preview-modal="false"
      :paginate-elements-by-height="1100"
      filename="Loan"
      :pdf-quality="2"
      pdf-format="a4"
      pdf-orientation="portrait"
      pdf-content-width="800px"
      :manual-pagination="true"
      :html-to-pdf-options=htmlToPdfOptions
      @progress="onProgress($event)"
      @beforeDownload="beforeDownload($event)"
      ref="html2Pdf"
      id="printMe">
      <!--START: Report Header -->
      <!--TUBRI Title-->
      <section slot="pdf-content"  class="print-box">
          <el-row type="flex" justify="space-between" align="center">
            <el-col :span="6"></el-col>
            <el-col :span="6"><div class="header-title-info"> <h4><I>INVOICE OF SPECIMENS</I></h4> </div></el-col>
            <el-col :span="6"><div class="header-title-info"> <h4><i>Loan No: {{ this.form.loanNumber }}</i></h4></div></el-col>
          </el-row>
          <el-row type="flex" justify="space-around" align="center">

            <el-col :span="12"><div class="header-title-info"> <h2><i><B> Tulane University</B></i></h2> </div></el-col>

          </el-row>
          <el-row type="flex" justify="space-around" align="center">
            <el-col :span="12"><div class="header-title-info"> <h2><i><B> Museum of Natural History </B></i></h2></div></el-col>

          </el-row>
          <el-row type="flex" justify="space-around" align="center">
            <el-col :span="12"><div class="header-title-info"> <h4><i><B> BELLE CHASE, LOUISIANA 70037 </B></i></h4> </div></el-col>
          </el-row>
          <el-row type="flex" justify="space-around" align="center">
            <el-col :span="12"><div class="header-title-info"> <h5><i>(504)394-1711</i></h5> </div></el-col>
          </el-row>

          <el-divider></el-divider>
          <!--sender:addr and date-->
          <el-row type="flex" align="space-between">
            <el-col :span="12" :offset="3"><div class="header-sender-info"> <span>To: </span><span>{{this.form.loanPeopleTitle}}</span> <span>{{ this.form.loanPeopleFullName }}</span> </div></el-col>
            <el-col :span="12" :offset="3"><div class="header-sender-info"> <span>LoanNumber: {{ this.form.loanNumber }}</span> </div></el-col>
          </el-row>

          <el-row type="flex" align="space-between">
            <el-col :span="12"  :offset="3"><div class="header-sender-info"> <span>{{ this.form.groupName }}</span> </div></el-col>
            <el-col :span="12"  :offset="3"><div class="header-sender-info"> <span>LoanDate: {{ this.form.loanDate }}</span> </div></el-col>
          </el-row>

          <el-row type="flex" align="space-between">
            <el-col :span="12"  :offset="3"><div class="header-sender-info"> <span>{{ this.form.organizationID }}</span> </div></el-col>
            <el-col :span="12"  :offset="3"><div class="header-sender-info"> <span>Length of Loan: 6 Months</span> </div></el-col>
          </el-row>

          <el-row type="flex" align="space-between">
            <el-col :span="12"  :offset="6"><div class="header-reminder"> <span><i>Retain in 70% ethanol unless otherwise noted</i></span> </div></el-col>
          </el-row>
          <!--END: Report header-->
          <!--START: Report lots list-->
          <!--list header-->
          <el-row type="flex" align="space-around">
            <el-col :span="2" offset="3"><div class="lots-list-header"> <span><i><b>TU</b></i></span> </div></el-col>
            <el-col :span="12"><div class="lots-list-header"> <span><i><b>Taxon and Locality</b></i></span> </div></el-col>
            <el-col :span="10"><div class="lots-list-header"> <span><i><b>Specimen Count</b></i></span> </div></el-col>
          </el-row>


      <!--lot list item-->
      <div class="lot-item-box" v-for="(item,index) in this.form.loanDetails" :key="item.PrimaryID">
          <div class="lot-item-first-line">
            <el-row type="flex" align="space-around">
              <el-col :span="2" offset="3"><div class="lot-item-first-line-content"> <span><b>{{ item.CatalogNumber }}</b></span> </div></el-col>
              <el-col :span="12"><div class="lot-item-first-line-content"> <span><b>{{ item.FullScientificName }}</b></span> </div></el-col>
              <el-col :span="10"><div class="lot-item-first-line-content"> <span>{{ item.Quantity }} <i>of</i> {{ '  ' + item.TotalNumber }}</span> </div></el-col>
            </el-row>
          </div>
          <div class="lot-item-body">
            <!--Locality-->
            <el-row type="flex" align="space-around">
              <el-col :span="2" offset="3"></el-col>
              <el-col :span="12">
                <div class="lot-item-content">
                  <span>{{ item.LocalityContinent }}</span>
                  <span>{{ item.LocalityState }}</span>
                  <span>{{ item.LocalityCounty }}</span>
                </div>
              </el-col>
              <el-col :span="10"></el-col>
            </el-row>

            <el-row type="flex" align="space-around">
              <el-col :span="2" offset="3"></el-col>
              <el-col :span="12"><div class="lot-item-content"> <span>{{ item.LocalityString }}</span> </div></el-col>
              <el-col :span="10"></el-col>
            </el-row>
            <!--Drainage-->
            <el-row type="flex" align="space-around">
              <el-col :span="2" offset="3"></el-col>
              <el-col :span="12"><div class="lot-item-content">
                <span><i>Dr:</i></span>
                <span> {{ item.Drainage }}</span>
              </div>
              </el-col>
              <el-col :span="10"></el-col>
            </el-row>

            <!--Field No.-->
            <el-row type="flex" align="space-around">
              <el-col :span="2" offset="3"></el-col>
              <el-col :span="12"><div class="lot-item-content">
                <span> {{ item.FieldNo }} </span>
              </div>
              </el-col>
              <el-col :span="10"></el-col>
            </el-row>
            <!--Start Date-->
            <el-row type="flex" align="space-around">
              <el-col :span="2" offset="3"></el-col>
              <el-col :span="12"><div class="lot-item-content">
                <span> {{ item.StartDate  }} </span>
              </div>
              </el-col>
              <el-col :span="10"></el-col>
            </el-row>

            <!--Coordinates-->
            <el-row type="flex" align="space-around">
              <el-col :span="2" offset="3"></el-col>
              <el-col :span="12">
                <div class="lot-item-content">
                  <span> <i>Lat/Lon:</i></span>
                  <span> <i>{{ item.Lat }}</i></span>
                  <span> <i>{{ item.Lon }}</i></span>
                </div>
              </el-col>
              <el-col :span="10"></el-col>
            </el-row>

            <!--Verbatim Collectors-->
            <el-row type="flex" align="space-around">
              <el-col :span="2" offset="3"></el-col>
              <el-col :span="12"><div class="lot-item-content">
                <span> {{ item.VerbatimCollectors}}</span>
              </div>
              </el-col>
              <el-col :span="10"></el-col>
            </el-row>
          </div>
        <div class="break" style="page-break-after: always;page-break-inside: avoid;" v-if="(index===1) || ((index>1) && ((index-1) % 4 === 0))"></div>
<!--        <div class="html2pdf__page-break" v-if="(index===1) || ((index>1) && ((index-1) % 4 === 0))"></div>-->
      </div>

        <el-row type="flex" align="space-between">
          <el-col :span="12" offset="3"><div class="footer-content">
            <span>Prepared by: <span class="signature-underline">J.G. Mann</span></span> </div>
          </el-col>
          <el-col :span="12" offset="3"><div class="footer-content">
            <span>Approved by: <span class="signature-underline">H.L. Bart</span></span> </div>
          </el-col>
        </el-row>
        <el-row type="flex" align="space-between">
          <el-col :span="16" offset="3">
            <div class="footer-content">
              <p>
                One copy is to be retained by the recipient; the other is to be signed and returned upon receipt of the material. Loans are ordinarily made for a period of six months or less. Please send reprints of any publications documenting use of this material.
              </p>
            </div>
          </el-col>
        </el-row>

        <el-row type="flex" align="space-between">
          <el-col :span="12" offset="3">
            <div class="footer-content">
              <span>Date received and condition:</span>
              <input type="text" class="blank-signature-underline">
            </div>
          </el-col>
        </el-row>

        <el-row type="flex" align="space-between">
          <el-col :span="12" offset="3">
            <div class="footer-content">
              <span>Signed:</span>
              <input type="text" class="blank-signature-underline">
            </div>
          </el-col>
        </el-row>
      <!--START: Report footer-->
      </section>
<!--      END: Report footer-->
<!--      <div class="page-footer">-->
<!--        <div class="bottom-left">{{ this.form.loanDate }}</div>-->
<!--        <div class="bottom-right" id="page-number"></div>-->
<!--      </div>-->
<!--      <div style="page-break-after: always;page-break-inside: avoid;"></div>-->
    </vue-html2pdf>

  </el-dialog>

    <el-dialog :visible="ActionDiablogVisible">
      <el-row type="flex" :gutter="20">
        <el-col :span="6">
          <el-button @click="viewLoan" type="primary" size="medium">Browse a Loan</el-button>
        </el-col>
        <el-col :span="12">
          <el-input v-model="form.loanNumber" placeholder="2022-001L"></el-input>
        </el-col>
        <el-col offset="1">
          OR <el-button @click="addLoan" type="success" size="medium">Create a New Loan</el-button>
        </el-col>
      </el-row>

    </el-dialog>


  </div>

</template>

<script>
import print from 'vue-print-nb'
import { parseTime } from '@/utils'
import VueHtml2pdf from 'vue-html2pdf'
// import { Previewer } from 'pagedjs';
import { getLoan, generateNewLoanID, generateNewGiftID, getLoanPeople, getLotString, addNewLoan, updateLoan } from '@/api/table'
const loanType = [
  { key: 'Loan', label: 'Loan' },
  { key: 'Gift', label: 'Gift' },
]


const loanDate = new Date()
export default {
  name: 'loanForm',
  props:{
    externalLoanId:{
      type: String,
      required: true
    }
  },
  data() {
    return {
      printDiablogVisible: false,
      printLoanDiablogVisible:false,
      progress:0, //generate pdf progress bar
      ActionDiablogVisible:false,
      formStatus: 'edit', //
      listLoading:false,
      loanPeople: [{
        LoanPeopleID:'34234',
        LastName:'eee',
        FirstName:'Wang'
      }],
      ifClosed:false,
      tempLot:{
        PrimaryID:'',
        CatalogNumber:'',
        PrimaryString: '',
        Quantity:0,
        QuantityReturned:0,
        QuantityResolved:0,
        DescriptionOfMaterial:'',
        InComments:'',
        OutComments:'',
        Remarks:''
    },
      htmlToPdfOptions: {
        html2canvas: {
          scrollX: 0,
          scrollY: 0
        },
        filename:"Loan",
        margin:[1,0,0,0]
      },
      loanType,
      form: {
        loanId:'',
        status:'edit', //"edit" or "new"
        loanNumber: '',
        loanNumberNoType:'',
        transactionType: 'Loan',
        loanDate: new Date(),
        closed: this.ifClosed ? 'NO' : 'YES',
        dateClosed: new Date(),
        text1: '',
        text2: '',
        loanPplID:'',
        loanPeopleFullName:'',
        loanPeopleTitle:'',
        agentID: '',
        loanAgents: '',
        organizationID: '',
        groupName:'',
        shipToAddress: '',
        shipToCity: '',
        shipToState: '',
        shipToZipCode: '',
        shipToCountry: '',
        shipToRemark: '',
        shipToMethod: '',
        address: '',
        country: '',
        city :'',
        state :'',
        postalCode:'',
        loanDetails: [{
          PrimaryID:'',
          CatalogNumber:'',
          PrimaryString: '',
          Quantity:0,
          QuantityReturned:0,
          QuantityResolved:0,
          DescriptionOfMaterial:'',
          InComments:'',
          OutComments:'',
          Remarks:'',
          FieldNo:'',
          FullScientificName:'',
          ScientificName:'',
          LocalityString:'',
          LocalityContinent:'',
          LocalityState:'',
          LocalityCounty:'',
          Drainage:'',
          StartDate:'',
          Lon:'',
          Lat:'',
          VerbatimCollectors:'',
          TotalNumber:0,
          FamilyName:''
        }],
        updatedLoanDetails: [],
        deletedLoanDetails: [],
        lotsTotal:0
      },
      printLoading: true,
      printObj: {
        //id: "printMe",
        id: "printPartials",
      }
    }
  },
  methods: {
    getNewLoanNumber(){
      generateNewLoanID({}).then(response =>{
        this.form.loanNumberNoType = response.data.LoanNumberNoType
        this.form.loanNumber = this.form.loanNumberNoType + 'L'
        this.listLoading = false
      })
    },
    getNewGiftNumber(){
      generateNewGiftID({}).then(response =>{
        this.form.loanNumberNoType = response.data.GiftNumberNoType
        this.form.loanNumber = this.form.loanNumberNoType + 'G'
        this.listLoading = false
      })
    },
    getLoanPeople(){
      getLoanPeople({}).then(response =>{
        response.data.items.sort((person1, person2)=>{
            return person2.LoanPeopleID - person1.LoanPeopleID
        })
        this.loanPeople = response.data.items //get Loan People sort Desending by AgentID
        this.listLoading = false
      })
    },
    getLoan(externalLoanId) {
      this.listLoading = true
      if(externalLoanId != undefined)
        this.form.loanNumber = externalLoanId
      getLoan({ loanId:this.form.loanNumber}).then(response => {

        this.form.loanDetails = response.data.lots
        this.form.lotsTotal = response.data.total
        if(this.form.lotsTotal>0){
          const firstItem = response.data.lots[0]
          this.form.loanId = firstItem.ID
          this.form.loanNumber = firstItem.LoanNumber
          this.form.transactionType = firstItem.TransactionType
          this.form.loanDate = firstItem.LoanDate
          this.form.closed = firstItem.Closed === 'Yes'? true : false
          this.form.dateClosed = firstItem.DateClosed,
          this.form.text1 = firstItem.Text1,
            this.form.text2 = firstItem.Text2
            this.form.loanPplID = firstItem.LoanPeopleID
            this.form.loanPeopleFullName = firstItem.FirstName + ' ' + firstItem.LastName
          this.form.loanPeopleTitle = firstItem.Title
            this.form.agentID = firstItem.AgentID
            this.form.loanAgents = firstItem.LoanAgents
            this.form.organizationID = firstItem.OrganizationID
          this.form.groupName = firstItem.GroupName
            this.form.shipToAddress = firstItem.ShipToAddress
            this.form.shipToCity = firstItem.ShipToCity
            this.form.shipToState = firstItem.ShipToState
            this.form.shipToZipCode = firstItem.ShipToZipCode
            this.form.shipToCountry = firstItem.ShipToCountry
            this.form.shipToRemark = firstItem.ShipToRemarks
            this.form.shipToMethod = firstItem.ShipToMethod
          this.form.address = firstItem.Address
          this.form.country = firstItem.Country
          this.form.city = firstItem.City
          this.form.state = firstItem.State
          this.form.postalCode = firstItem.PostalCode
        }
        // Just to simulate the time of the request
        // setTimeout(() => {
        //   this.listLoading = false
        // }, 1.5 * 1000)
        this.listLoading = false
      })
    },
    changeType(e){
      this.updateLoanNumber()
      // if(this.form.transactionType === 'Loan'){
      //   this.form.loanNumber = this.form.loanNumberNoType + 'L'
      // }
      // else{
      //   this.form.loanNumber = this.form.loanNumberNoType + 'G'
      // }
    },
    addNewLot(){
      let newLot = {
        PrimaryID:'',
        CatalogNumber:'',
        PrimaryString: '',
        Quantity:0,
        QuantityReturned:0,
        QuantityResolved:0,
        DescriptionOfMaterial:'',
        InComments:'',
        OutComments:'',
        Remarks:'',
      }
      this.form.loanDetails.unshift(newLot)
      if(this.form.status==='edit')
        this.form.updatedLoanDetails.unshift(newLot)
    },
    // handlePrint(){
    //   let paged = new Previewer();
    //   let flow = paged.preview(document.querySelector("#printMe").innerHTML,[], null).then((flow) => {
    //
    //     window.print()
    //     })
    //
    // },

    handleDelete(row, index) {
      this.$notify({
        title: 'Success',
        message: 'Delete Successfully',
        type: 'success',
        duration: 2000
      })
      if(this.form.status === 'new')
        this.form.loanDetails.splice(index, 1)
      else if(this.form.status === 'edit') {
        this.form.deletedLoanDetails.unshift(this.form.loanDetails[index])
        this.form.loanDetails.splice(index, 1)
      }
    },
    generatePDF() {
      this.$refs.html2Pdf.generatePdf();
    },
    onProgress(progress) {
      this.progress = progress;
      console.log(`PDF generation progress: ${progress}%`)
    },
    async beforeDownload ({ html2pdf, options, pdfContent }) {
      await html2pdf().set(options).from(pdfContent).toPdf().get('pdf').then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
          console.log(pdf,pdf.internal.pageSize.getWidth(),pdf.internal.pageSize.getHeight())
          pdf.setPage(i)
          pdf.setFontSize(10)
          pdf.setTextColor(150)
          pdf.text('Page ' + i + ' of ' + totalPages, (pdf.internal.pageSize.getWidth() * 0.4), (pdf.internal.pageSize.getHeight() - 0.5))
          //window.open(pdf.output('bloburl'), '_blank')
        }
      }).save()
    },
    exportExcel(){
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = [
        "Abbreviation",
        "Address",
        "AgentID",
        "CatalogNumber",
        "City",
        "Closed",
        "Country",
        "DateClosed",
        "DescriptionOfMaterial",
        "Drainage",
        "FamilyID",
        "FamilyName",
        "Fax",
        "FieldNo",
        "FullScientificName",
        "GroupName",
        "InComments",
        "Institution",
        "JarSize",
        "JobTitle",
          "FirstName", "MiddleName", "LastName","Email",
          "Lon",
        "Lat",
        "LoanAgents",
        "LoanDate",
        "LoanItemID",
        "LoanNumber",
        "LocalityContinent",
        "LocalityCounty",
        "LocalityState",
        "LocalityString",
          "OrganizationID",
          "OutComments",
          "Phone1",
          "Phone2",
          "PostalCode",
          "PrimaryString",
          "Quantity",
          "QuantityResolved",
          "QuantityReturned",
          "Remarks",
          "ScientificName",
          "ShipToAddress",
          "ShipToCity",
          "ShipToCountry",
          "ShipToMethod",
          "ShipToRemarks",
          "ShipToState",
          "ShipToZipCode",
          "StartDate",
          "State",
          "Text1",
          "Text2",
          "Title",
          "TotalNumber",
          "TransactionType",
          "VerbatimCollectors",]
        const filterVal = [
          "Abbreviation",
          "Address",
          "AgentID",
          "CatalogNumber",
          "City",
          "Closed",
          "Country",
          "DateClosed",
          "DescriptionOfMaterial",
          "Drainage",
          "FamilyID",
          "FamilyName",
          "Fax",
          "FieldNo",
          "FullScientificName",
          "GroupName",
          "InComments",
          "Institution",
          "JarSize",
          "JobTitle",
          "FirstName", "MiddleName", "LastName","Email",
          "Lon",
          "Lat",
          "LoanAgents",
          "LoanDate",
          "LoanItemID",
          "LoanNumber",
          "LocalityContinent",
          "LocalityCounty",
          "LocalityState",
          "LocalityString",
          "OrganizationID",
          "OutComments",
          "Phone1",
          "Phone2",
          "PostalCode",
          "PrimaryString",
          "Quantity",
          "QuantityResolved",
          "QuantityReturned",
          "Remarks",
          "ScientificName",
          "ShipToAddress",
          "ShipToCity",
          "ShipToCountry",
          "ShipToMethod",
          "ShipToRemarks",
          "ShipToState",
          "ShipToZipCode",
          "StartDate",
          "State",
          "Text1",
          "Text2",
          "Title",
          "TotalNumber",
          "TransactionType",
          "VerbatimCollectors",]
        const data = this.formatJson(filterVal)
        excel.export_json_to_excel({
          header:tHeader,
          data,
          filename: this.form.loanNumber + "_lots",
          autoWidth:true,
          bookType:'xlsx'
        })
      })
    },
    formatJson(filterVal) {
      return this.form.loanDetails.map(v => filterVal.map(j => {
        return v[j]
      }))
    },
    printPartialLabels(){
      this.$set(this.printObj,"id","printPartials")
      this.printDiablogVisible = true
    },
    printLoan(){
      this.$set(this.printObj,"id","printMe")
      this.printLoanDiablogVisible = true
    },
    loanCloseSwitch(){
      this.form.closed = this.ifClosed ? 'NO' : 'YES'
    },
    onfoucs(val) {
      const selected = false //聚焦取消勾选
      //this.$refs.multipleTable.toggleRowSelection(val.row, selected) //ref定义在el-table中
    },
    // 输入框失焦事件
    blurUsername(val) {
      const selected = true //失焦勾选
      //this.$refs.multipleTable.toggleRowSelection(val.row, selected)
      getLotString({ catId:val.CatalogNumber}).then(response =>{
        if(response.data.total===0){
          val.PrimaryString = 'No result'
        }
        else{
          let lotString = response.data.items[0].LotString
          val.PrimaryString = lotString
          val.Quantity = response.data.items[0].TotalNumber
          val.PrimaryID = response.data.items[0].LotID
        }

      });
    },
    onSubmit() {
      addNewLoan(this.form).then(() =>{
        this.$message('submit!')
      })
    },
    onUpdate(){
      updateLoan(this.form).then(() =>{
        this.$message('updated!')
      })
    },
    onCancel() {
      this.$message({
        message: 'cancel!',
        type: 'warning'
      })
    },
    viewLoan(){
      this.ActionDiablogVisible = false
      // console.log("1")
      // this.getLoan()
      this.form.status = 'edit'
    },
    addLoan(){
      this.ActionDiablogVisible = false
      this.updateLoanNumber()
      this.form.status = 'new'
    },
    loadLoanFromExternal(){
      this.ActionDiablogVisible = false
      console.log("2")
      this.getLoan(this.externalLoanId)
    },
    updateLoanNumber(){
      if(this.form.transactionType === 'Loan'){
        this.getNewLoanNumber()
      }
      else{
        this.getNewGiftNumber()
      }
    }
  },
  components:{
    VueHtml2pdf,
  },

  mounted() {
    //getLoanPeople
    this.getLoanPeople()
    //this.handlePrint()
    if(this.externalLoanId)
      this.viewLoan()
    else
      this.addLoan()

  },
  directives: {
    print
  }
}
</script>

<style scoped>
.line{
  text-align: center;
}
.el-row{
  font-family: "Times New Roman";
}
h2,h3,h4,h5{
  margin-block-end: 0.3em;
  margin-block-start: 0.3em;
}
.header-sender-info{
  font-size:1em;
  padding-bottom: 0.5em;
}
.header-reminder{
  font-size:0.8em;
  padding: 0.8em;
}
.header-title-info{
  text-align: center;
}
.header-sender-info{
  text-align: left;
}

.lots-list-header,.lot-item-first-line-content,.lot-item-content{
  padding-bottom: 1em;
}

.lot-item-first-line-content,.lot-item-content{
  font-size: 0.8em;
}

.lot-item-content .label-item-content span{
  padding-right: 2em;
}

.label-item-content{
  font-size: 22px;
  padding-left:0.6em;
}
.label-item-row{
  padding: 0.1em;
}

.lot-item-box{
  padding:0.5em 0em;
}

.footer-content{
  font-size: 1em;
  padding-bottom: 1em;
}

.signature-underline{
  text-decoration: none;
  border-bottom: 1px solid;
  border-color:black;
}
input.blank-signature-underline{
  /*width:100%;*/
}
.label-textarea >>> .el-textarea__inner{
  resize:none;
  color:black;
  border:0px;
  font-size: 15px;
  overflow-y: visible;
}
.blank-signature-underline{
  border: 0;
  border-bottom: 1px solid;
}
.print-box{
  position: relative;
}
.page-footer {
  position: fixed;
  bottom: 0;
  width: 100%;
}


.bottom-left{
  /*position: absolute;*/

  left: 0px;
}
.bottom-right{
  /*position: absolute;*/
  /*bottom: 0px;*/
  right: 0px;
}

@media print {
  /*@page{*/
  /*  size:2in 1in;*/
  /*}*/
  /*body{*/
  /*  height:auto;*/
  /*}*/
  /*.footer {page-break-after: always;}*/
  .break{
    page-break-before: always;
  }
  .break:first-child {
    page-break-before: avoid;
    counter-reset: page;
  }
  #page-number:after {
    counter-increment: page_number;
    content: "Page " counter(page_number);
  }
  @page {

  }

}
</style>

