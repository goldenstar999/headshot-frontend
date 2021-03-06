import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import classNames from 'classnames';
import withStyles from "@material-ui/core/styles/withStyles";
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import ImageLoader from 'react-loading-image';
import HeadshotAPI from '../../apis/headshotAPIs';
import Spacer from '../common/material/Spacer';
import ProductionSteper from './ProductionSteper';
import SelectQuantity from './SelectQuantity';
import CloudinaryUploader from './CloudinaryUploader';
import ProductionUserInfo from './ProductionUserInfo';
import ProductionReview from './ProductionReview';
import StripeCheckoutButton from './stripe/StripeCheckoutButton';
import * as appUtils from '../../utils/appUtils';
import * as productionActions from '../../actions/productionActions';
import { materialStyles } from '../../styles/material/index';


class Production extends Component {
  state = {
    loading: false,
    production: null,
    quantityId: null,
    order: null,
    step: 0,
    hasImage: false,
    uploadImageUrl: null,
    fileName: '',
    email: '',
    headshot: null,
    paid: false
  };

  componentWillMount() {
    this.setState({
      loading: true,
      step: 0,
      headshot: null,
      ...this.props.production
    }, () => {
      HeadshotAPI.getProduction(this.props.productionId, this.handleGetProductionResponse);
    });
  }

  handleGetProductionResponse = (response, isFailed) => {
    this.setState({production: response, loading: false});
  };

  handleClickGallery = (productionId) => {
    this.props.onChangeMenu({key: 'imagemap', productionId});
  };

  handleChangeOrder = order => {
    this.setState({ order });
  };

  handleChangeQuantity = quantityId => {
    this.setState({ quantityId });
  };

  handleChangeStep = (step) => {
    this.setState({step});
  }

  handleChange = (name, value) => {
    console.log(name, value);
    this.setState({[name]: value});
  }

  handleNext = () => {
    const { step, paid } = this.state;
    if (step === 1) {
      // Create new headshot
      this.setState({loading: true}, () => {
        const { email, fileName, uploadImageUrl, quantityId } = this.state;
        let data = {
          "email": email,
          "file_name": fileName,
          "quantity": quantityId,
          "status": "Draft"
        };
        HeadshotAPI.createHeadshot(data, this.handleCreateHeadshot);
      });
    } else {
      this.setState({
        step: step + 1,
      }, () => {
        this.props.productionActions.setProductionState(this.state);
        if (paid) {
          this.props.onChangeMenu({key: 'productions'});    
        }
      });  
    }
  };

  handleBack = () => {
    this.setState({
      step: this.state.step - 1,
    }, () => {
      this.props.productionActions.setProductionState(this.state);
      if (this.state.step === 1) {
        if (this.state.headshot) HeadshotAPI.deleteHeadshot(this.state.headshot.id, handleCreateHeadshot);
      }
    });
  };

  handleReset = () => {
    this.setState({
      step: 0,
    }, () => {
      this.props.productionActions.setProductionState(this.state);
    });
  };

  handleCreateHeadshot = (response, isFailed) => {
    if (isFailed) {}
    else this.setState({loading: false, headshot: response, step: this.state.step + 1}, () => {
      this.props.productionActions.setProductionState(this.state);
    });
  }

  handleCheckout = (token, isFailed) => {
    if(isFailed) {}
    else {
      this.setState({loading: true}, () => {
        this.props.productionActions.setProductionState(this.state);
      });
    }
  }

  handlePayment = (response, isFailed) => {
    if(isFailed) {}
    else {
      this.setState({loading: false, paid: true, step: this.state.step + 1}, () => {
        this.props.productionActions.setProductionState(this.state);
      });
    }
  }

  renderStepForm = () => {
    const { production, step, order, quantityId, hasImage } = this.state;
    switch (step) {
      case 0:
        return <SelectQuantity
                production={production}
                quantityId={quantityId}
                onChangeQuantity={this.handleChangeQuantity}
                order={order}
                onChangeOrder={this.handleChangeOrder}
              />;
      case 1:
        return <ProductionUserInfo hasImage={hasImage} onChange={this.handleChange} />;
      case 2:
        return this.props.onChangeMenu({key: 'imagemap', productionId: production.id});
      case 3: 
        return <ProductionReview />;
      default:
        return <ProductionReview />;
    }
  }

  render = () => {
    const { classes } = this.props;
    const { loading, production, step, quantityId, headshot, paid } = this.state;
    console.log('==== production: ', this);
    let amount = 0;
    let price = 0;
    let fileName = headshot ?  headshot.file_name : '';
    let imageUrl = headshot ? headshot.cloudinary_image_secure_url : '';
    let productionQuantities = [];
    // Get current quantity
    let currentQuantity = null;
    if (production && production.production_quantities) {
      currentQuantity = production.production_quantities.find(quantity => {
        return quantity.id === quantityId;
      });
    }
    if (currentQuantity) {
      amount = currentQuantity.amount;
      price = parseFloat(currentQuantity.plus_price);
    }

    if (!(production && production.production_quantities)) {
      return (
        <Paper className={classes.containerPaper} center>
          <CircularProgress size={40} thickness={5} />
        </Paper>
      );
    }

    return (
      <Paper className={classes.containerPaper}>
        <Grid container spacing={24}>
          <Grid item lg={4} md={6} sm={12} xs={12}>
            <ImageLoader
              className={classes.productionGalleryImage}
              src={appUtils.generateImageUrl(production.overview_image)}
              loading={() => <CircularProgress size={20} thickness={5} />}
              error={() => <img src={require("../../images/missing.png")} />} 
            />
          </Grid>

          <Grid item lg={8} md={6} sm={12} xs={12}>
            <Grid container spacing={16}>
              <Grid item xs={6}>
                <Typography className={classNames(classes.pageTitleText, classes.bold)}>
                {production.title}
                </Typography>
              </Grid>
              <Grid item xs={6} className={classes.rightText}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="samll"
                  disabled={step === 0}
                  className={classes.nextButton}
                  onClick={this.handleBack}
                >
                  { 'Back' }
                </Button>
                {
                  ((step === appUtils.getSteps().length - 1) && !paid) ? (
                    <StripeCheckoutButton 
                      headshot={headshot} 
                      amount={price} 
                      onCheckout={this.handleCheckout} 
                      onPayment={this.handlePayment}
                    />
                  ) : (
                    <Button
                    variant="contained"
                     color="primary"
                     size="samll"
                     className={classes.nextButton}
                     onClick={this.handleNext}
                   >
                     { paid ? 'Finish' : 'Next' }
                   </Button>
                  )
                }
              </Grid>
              <Grid item xs={12}>
                <ProductionSteper step={step} onChangeStep={this.handleChangeStep} />
              </Grid>
              <Grid item xs={12}>
                { this.renderStepForm() }
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}

function mapStateToProps(state) {
  const { productions, production } = state;
  return {
    productions,
    production
  }
}

function mapDispatchToProps(dispatch) {
  return {
    productionActions: bindActionCreators(productionActions, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(materialStyles)(Production));
