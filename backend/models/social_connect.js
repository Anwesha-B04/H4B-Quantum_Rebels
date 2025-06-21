import mongoose  from "mongoose";


const SocialsConnectSchema = new mongoose.Schema({
   userId: {
      type: String,
      required: true
   },
   githubScrapedData: {
      userName: {
         type: String
      },
      avatar: {
         type: String
      },
      bio: {
         type: String
      },
      followers: {
         type: String
      },
      following: {
         type: String
      },
      repos: {
         type: String
      }
   },
   LinkedinData: {
      FullName: {
         type: String
      },
      headline: {
         type: String
      },
      Summary: {
         type: String
      },
      Experience: {
         type: Array
      },
      Education: {
         type: Array
      },
      Skills: {
         type: Array
      },
      Certifications: {
         type: Array
      }
   }
}, { timestamps: true });

const SocialsConnect = mongoose.model("Socials_Connect", SocialsConnectSchema);

export default SocialsConnect;