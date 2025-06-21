import gs from "github-scraper";

const githubScrapper = async (req, res) => {
  const { Username } = req.body;
  try {
    var url = `/${Username}`;
    gs(url, function (err, data) {
      console.log(data); 
      return res.status(200).json({
        success: true,
        message: "Github data fetched successfully",
        data,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const githubRepo = async (req, res) => {
  const { Username } = req.body;
  try {
    var url = `${Username}?tab=repositories`;
    gs(url, function (err, data) {
      console.log(data); 
      return res.status(200).json({
        success: true,
        message: "Github data fetched successfully",
        data,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const linkedinData=async(req,res)=>{
  const {fullname , headline  , summary ,experience  , skills , source , certifcations}=req.body;
  
}




export { githubScrapper ,githubRepo };
